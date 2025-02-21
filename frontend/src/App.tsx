import { useState } from 'react';
import { Button, Box, Typography, TextField } from '@mui/material';
import axios from 'axios';

function App() {
  let ws: WebSocket;
  let audioContext: AudioContext;
  let mediaStream: MediaStream;
  let scriptProcessor: ScriptProcessorNode;

  const [recording, setRecording] = useState(false);
  const [output, setOutput] = useState('');

  const handleAudioUpload = async (event: any) => {
    const file = event.target.files[0];

    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post("https://0eef-24-189-85-157.ngrok-free.app/asr/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setOutput(response.data.transcript);
      } catch (error) {
        console.error("Error processing audio file:", error);
        setOutput("Error in ASR processing.");
      }
    }
  };

  const handleStartRecording = async () => {
    setRecording(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Web Audio API is not supported in your browser.");
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(mediaStream);

      scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(scriptProcessor);
      scriptProcessor.connect(audioContext.destination);

      ws = new WebSocket("wss://0eef-24-189-85-157.ngrok-free.app/ws");
      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        console.log("Connected to WebSocket server");
      };

      scriptProcessor.onaudioprocess = (event) => {
        if (ws.readyState === WebSocket.OPEN) {
          let inputBuffer = event.inputBuffer.getChannelData(0);
          let pcmBuffer = new Int16Array(inputBuffer.length);

          for (let i = 0; i < inputBuffer.length; i++) {
            pcmBuffer[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 32767;
          }

          ws.send(pcmBuffer.buffer);
        }
      };

      ws.onmessage = (event) => {
        setOutput(output + event.data + ' ');
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access the microphone. Please allow microphone access.");
    }
  };

  const handleStopRecording = () => {
    setRecording(false);
    if (scriptProcessor) {
      scriptProcessor.disconnect();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
      audioContext.close();
    }
    if (ws) {
      ws.close();
    }
  };

  return (
    <Box sx={{ width: '100%', padding: 2, marginY: "40px" }}>
      <Typography
        variant="h2"
        sx={{
          marginX: "10%",
          fontWeight: "bold",
          color: "rgb(67, 91, 224)",
          textShadow: "4px 4px 10px rgba(0, 0, 0, 0.5)",
        }}
      >

        Real-time translation & audio file ASR
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        <Button variant="contained" color="primary" onClick={handleStartRecording} disabled={recording}>
          Start Recording
        </Button>
        <Button variant="contained" color="secondary" onClick={handleStopRecording} disabled={!recording}>
          Stop Recording
        </Button>
      </Box>

      <Box
        component="input"
        type="file"
        onChange={handleAudioUpload}
        accept="audio/*"
        sx={{
          padding: "10px",
          border: "2px dashed #6200ea",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          marginX: "400px",
          marginY: "50px",
          justifyContent: 'center',
          "&:hover": {
            borderColor: "#ff8a00",
          },
        }}
      />

      <Box sx={{ display: 'flex', justifyContent: 'space-around', marginY: 5 }}>
        <TextField sx={{ marginX: 5 }}
          label="Real-time Translation"
          variant="outlined"
          value={output}
          fullWidth
          multiline
          rows={14}
        />
      </Box>
    </Box>
  );
}

export default App;
