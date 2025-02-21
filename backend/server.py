from fastapi import FastAPI, File, UploadFile, WebSocket
import uvicorn
import riva.client
from fastapi.middleware.cors import CORSMiddleware 

app = FastAPI()

auth = riva.client.Auth(uri='localhost:50051')
riva_asr = riva.client.ASRService(auth)

app.add_middleware( 
    CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
)

file_config = riva.client.RecognitionConfig(
    language_code="en-US",
    max_alternatives=1,
    enable_automatic_punctuation=True,
    enable_word_time_offsets=True,
)
riva.client.asr.add_speaker_diarization_to_config(file_config, diarization_enable=True, diarization_max_speakers=8)

stream_config = riva.client.RecognitionConfig(
    encoding=riva.client.AudioEncoding.LINEAR_PCM,
    language_code="en-US",
    max_alternatives=1,
    enable_automatic_punctuation=True,
    verbatim_transcripts=False,
    enable_word_time_offsets=True,
    sample_rate_hertz=16000,
    audio_channel_count=1,
)
riva.client.asr.add_speaker_diarization_to_config(stream_config, diarization_enable=True, diarization_max_speakers=8)

@app.post("/asr/")
async def transcribe_audio(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".wav"):
        raise ValueError("Invalid file format! Only .wav files are allowed.")

    content = await file.read()

    response = riva_asr.offline_recognize(content, file_config)

    speaker_transcripts = {} 
    for result in response.results:
        for word in result.alternatives[0].words:
            speaker_tag = word.speaker_tag if word.speaker_tag else 0 
            if speaker_tag not in speaker_transcripts: 
                speaker_transcripts[speaker_tag] = [] 
            speaker_transcripts[speaker_tag].append(word.word) 

    formatted_transcript = "\n".join( 
        [f"Speaker {speaker}: {' '.join(words)}" for speaker, words in sorted(speaker_transcripts.items())] ) 
    
    return {"transcript": formatted_transcript}

count = 0

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handles WebSocket connections for real-time speech transcription."""
    await websocket.accept()
    print("Client connected")

    try:
        async for message in websocket.iter_bytes():
            response = riva_asr.offline_recognize(message, stream_config)
            if response.results and response.results[0].alternatives:
                transcript = response.results[0].alternatives[0].transcript
                print(f"Transcribed text: {transcript}")
                if count > 3:
                    transcript = f"\n{transcript}"
                    count = 0
                await websocket.send_text(transcript)
            else:
                count += 1

    except Exception as e:
        print(f"WebSocket error: {e}")

    finally:
        print("Client disconnected")


if __name__ == "__main__": 
    uvicorn.run(app, host="0.0.0.0", port=8000,)

