[![License](https://img.shields.io/badge/license-MIT-green)](https://opensource.org/licenses/MIT)
# NVIDIA Riva Clients

NVIDIA Riva is a GPU-accelerated SDK for building Speech AI applications that are customized for your use 
case and deliver real-time performance. This repo provides performant client example command-line clients.

## Main API

- `riva.client.ASRService` is a class for speech recognition,
- `riva.client.TTSService` is a class for speech synthesis,
- `riva.client.NLPService` is a class for natural language processing.

## CLI interface

- **Automatic Speech Recognition (ASR)**
    - `scripts/asr/riva_streaming_asr_client.py` demonstrates streaming transcription in several threads, can prints time stamps.
    - `scripts/asr/transcribe_file.py` performs streaming transcription,
    - `scripts/asr/transcribe_file_offline.py` performs offline transcription,
    - `scripts/asr/transcribe_mic.py` performs streaming transcription of audio acquired through microphone.
- **Speech Synthesis (TTS)**
    - `scripts/tts/talk.py` synthesizes audio for a text in streaming or offline mode.
- **Natural Language Processing (NLP)**
    - `scripts/nlp/intentslot_client.py` recognizes intents and slots in input sentences,
    - `scripts/nlp/ner_client.py` detects named entities in input sentences,
    - `scripts/nlp/punctuation_client.py` restores punctuation and capitalization in input sentences,
    - `scripts/nlp/qa_client.py` queries a document with natural language query and prints answer from a document,
    - `scripts/nlp/text_classify_client.py` classifies input sentences,
    - `scripts/nlp/eval_intent_slot.py` prints intents and slots classification reports for test data.
  
## Installation

1. Create a ``conda`` environment and activate it
2. From source: 
    - Clone ``riva-python-clients`` repo and change to the repo root
    - Run commands

```bash
git clone https://github.com/MONATE-TEAM/riva-client.git
cd riva-client
git submodule init
git submodule update --remote --recursive
pip install -r requirements.txt
python3 setup.py bdist_wheel
pip install --force-reinstall dist/*.whl
```
3. `pip`:
```bash
pip install nvidia-riva-client
```

If you would like to use output and input audio devices 
(scripts `scripts/asr/transcribe_file_rt.py`, `scripts/asr/transcribe_mic.py`, `scripts/tts/talk.py` or module 
`riva.client/audio_io.py`), you will need to install `PyAudio`.
```bash
conda install -c anaconda pyaudio
```

For NLP evaluation you will need `transformers` and `sklearn` libraries.
```bash
pip install -U scikit-learn
pip install -U transformers
```

## Before using microphone and audio output devices on Unix
you may need to run commands
```
adduser $USER audio
adduser $USER pulse-access
```
and restart.

## Your backend
```bash
python backend/server.py
```

## Your frontend
```bash
cd frontend
npm run dev
```

You can access to web ui via this url: http://localhost:5173


## Please configure .env file of frontend with this format
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```