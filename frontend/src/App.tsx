import { useState, useRef } from "react";
import { Button, Box, Typography, TextField } from "@mui/material";
import axios from "axios";

const WS_URL = "wss://0eef-24-189-85-157.ngrok-free.app/ws";
const API_URL = "https://0eef-24-189-85-157.ngrok-free.app/asr/";

function App() {
  const [recording, setRecording] = useState(false);
  const [output, setOutput] = useState("");

  const ws = useRef<WebSocket | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);

  let count = 0;

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setOutput(response.data.transcript);
    } catch (error) {
      console.error("Error processing audio file:", error);
      setOutput("Error in ASR processing.");
    }
  };

  const handleStartRecording = async () => {
    setRecording(true);

    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Web Audio API is not supported in your browser.");
      return;
    }

    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContext.current = new AudioContext({ sampleRate: 16000 });

      const source = audioContext.current.createMediaStreamSource(mediaStream.current);
      scriptProcessor.current = audioContext.current.createScriptProcessor(8192, 1, 1);

      source.connect(scriptProcessor.current);
      scriptProcessor.current.connect(audioContext.current.destination);

      ws.current = new WebSocket(WS_URL);
      ws.current.binaryType = "arraybuffer";

      ws.current.onopen = () => console.log("Connected to WebSocket server");
      ws.current.onmessage = (event) => {
        if (event.data)
        {
          console.log(event.data);
          if (count > 3)
            setOutput((prevOutput) => prevOutput + "\n" + event.data + " ");
          else
            setOutput((prevOutput) => prevOutput + event.data + " ");
        }
        else
        {
          count++;
        }
      };
      ws.current.onclose = () => console.log("WebSocket connection closed");

      scriptProcessor.current.onaudioprocess = (event) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          const inputBuffer = event.inputBuffer.getChannelData(0);
          const pcmBuffer = new Int16Array(inputBuffer.length);

          for (let i = 0; i < inputBuffer.length; i++) {
            pcmBuffer[i] = Math.max(-1, Math.min(1, inputBuffer[i])) * 32767;
          }

          ws.current.send(pcmBuffer.buffer);
        }
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access the microphone. Please allow microphone access.");
      setRecording(false);
    }
  };

  const handleStopRecording = () => {
    setRecording(false);

    scriptProcessor.current?.disconnect();
    mediaStream.current?.getTracks().forEach((track) => track.stop());
    audioContext.current?.close();

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  return (
    <Box sx={{ width: "100%", padding: 2, marginY: "40px" }}>
      <Typography
        variant="h2"
        sx={{
          marginX: "10%",
          fontWeight: "bold",
          color: "rgb(67, 91, 224)",
          textShadow: "4px 4px 10px rgba(0, 0, 0, 0.5)",
        }}
      >
        Real-time Translation & Audio File ASR
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 3 }}>
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
          display: "block",
          textAlign: "center",
          "&:hover": { borderColor: "#ff8a00" },
        }}
      />

      <Box sx={{ display: "flex", justifyContent: "space-around", marginY: 5 }}>
        <TextField
          sx={{ marginX: 5 }}
          label="Real-time Translation"
          variant="outlined"
          value={output}
          fullWidth
          multiline
          rows={10}
        />
      </Box>
    </Box>
  );
}

export default App;