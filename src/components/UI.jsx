import { useEffect, useRef, useState } from 'react';
import { useChat } from '../hooks/useChat';
import axios from 'axios';
import { Mic, MicOff, RefreshCw } from 'lucide-react';

export const UI = ({ hidden, ...props }) => {
  const input = useRef();
  const { chat, loading, cameraZoomed, setCameraZoomed, message } = useChat();
  const qnRef = useRef();
  const ansRef = useRef();
  const [loader, setLoader] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const [uploadStatus, setUploadStatus] = useState({
    assignment: false,
    submission: false,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const [aiQuestions, setAiQuestions] = useState([]);

  // Speech Recognition setup
  const recognition = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognition.current = new SpeechRecognition();
        recognition.current.continuous = true;
        recognition.current.interimResults = true;

        recognition.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');
          setTranscript(transcript);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognition.current?.stop();
    } else {
      setTranscript('');
      recognition.current?.start();
    }
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    if (aiQuestions.length > 0) {
      console.log('Current Index:', currentIndex);
      chat(aiQuestions[currentIndex].message);
    }
  }, [currentIndex, aiQuestions]);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message) {
      chat(text);
      input.current.value = '';
    }
  };

  const handleFileUpload = async () => {
    try {
      // Read content of both files as text
      const assignmentContent = await readFileContent(qnRef.current.files[0]);
      const submissionContent = await readFileContent(ansRef.current.files[0]);

      // Create JSON data to send
      const data = {
        assignment: assignmentContent,
        submission: submissionContent,
      };

      setLoader(true);
      // Send JSON data to the backend
      const response = await axios.post('http://localhost:3000/upload', data, {
        headers: { 'Content-Type': 'application/json' },
      });
      setLoader(false);

      if (response.status === 200) {
        setAiQuestions(response.data);
        console.log('Questions:', response.data);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }
  };

  // Helper function to read file content
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  if (hidden) {
    return null;
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col">
        <div className="self-start backdrop-blur-md bg-white bg-opacity-50 p-4 rounded-lg">
          <h1 className="font-semibold text-2xl">Hi ! I'm Mary 😊</h1>
          <p>Online Ai Skills Assessor</p>
          {aiQuestions.length === 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="font-light text-sm text-pink-800">
                Please upload .txt Files
              </p>
              <label className="text-gray-700 flex items-center gap-2">
                Upload Questions
                {uploadStatus.assignment && (
                  <span className="text-green-500">✔</span>
                )}
              </label>
              <input
                type="file"
                accept=".txt"
                ref={qnRef}
                onChange={(e) => {
                  setUploadStatus((prev) => ({
                    ...prev,
                    assignment: true,
                  }));
                }}
                className="bg-white text-gray-800 p-2 rounded-md border border-gray-300 cursor-pointer pointer-events-auto"
              />

              <label className="text-gray-700 flex items-center gap-2">
                Upload Answers
                {uploadStatus.submission && (
                  <span className="text-green-500">✔</span>
                )}
              </label>
              <input
                type="file"
                accept=".txt"
                ref={ansRef}
                onChange={(e) => {
                  setUploadStatus((prev) => ({
                    ...prev,
                    submission: true,
                  }));
                }}
                className="bg-white text-gray-800 p-2 rounded-md border border-gray-300 cursor-pointer pointer-events-auto"
              />
              <button
                className="bg-pink-500 text-white  py-2 rounded-lg mt-2 text-lg hover:bg-pink-600 transition ease-in disabled:opacity-50"
                disabled={!(uploadStatus.submission && uploadStatus.assignment)}
                onClick={() => {
                  handleFileUpload();
                }}
              >
                {!loader ? <span>Begin Test</span> : <span>Loading...</span>}
              </button>
            </div>
          )}
          {aiQuestions.length > 0 && (
            <button
              onClick={() => {
                setAiQuestions([]);
                setUploadStatus({
                  assignment: false,
                  submission: false,
                });
                setCurrentIndex(0);
              }}
              className="bg-pink-500 text-white  px-3 py-2 rounded-lg mt-2 text-md hover:bg-pink-600 transition ease-in"
            >
              Retake
            </button>
          )}
          {aiQuestions.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <ul className="flex gap-2">
                {aiQuestions.map((question, index) => (
                  <li
                    key={index}
                    className={` h-10 w-10 p-2 rounded-full text-center ${
                      question.answer ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  >
                    {index + 1}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aiQuestions.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              {aiQuestions.length === currentIndex && (
                <button className="bg-pink-500 text-white  px-3 py-2 rounded-lg mt-2 text-md hover:bg-pink-600 transition ease-in">
                  Analyse Test
                </button>
              )}
            </div>
          )}
        </div>
        {/* Question Cloud - Positioned to the right side */}
        {aiQuestions.length > 0 && currentIndex < aiQuestions.length && (
          <div className="absolute right-40 top-80 max-w-md ">
            <div className=" relative bg-white p-4 rounded-2xl shadow-lg before:content-[''] before:absolute before:top-1/2 before:left-[-20px] before:w-0 before:h-0 before:border-r-[20px] before:border-r-white before:border-t-[10px] before:border-t-transparent before:border-b-[10px] before:border-b-transparent">
              <p className="text-gray-800 text-2xl">
                {aiQuestions[currentIndex].question}
              </p>
              {aiQuestions.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentIndex((prev) => prev + 1);
                    setAiQuestions((prev) => {
                      const newQuestions = [...prev];
                      newQuestions[currentIndex].answer = true;
                      return newQuestions;
                    });
                  }}
                  className=" flex flex-colbg-pink-500 text-white  px-3 py-2 rounded-full mt-2 text-md hover:bg-pink-600 transition ease-in mr-4 justify-right"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
        {/* Voice Input UI */}
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-4 w-full max-w-2xl">
          <div className="bg-white rounded-lg p-4 shadow-lg w-full">
            <p className="mb-4">You will have 30 secs to record your answers</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 min-h-[60px]">
                <p className="text-gray-700">{transcript}</p>
              </div>
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full transition-colors ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-pink-500 hover:bg-pink-600'
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
              <button
                onClick={() => {
                  setTranscript('');
                }}
                className="bg-pink-500 p-4 rounded-full text-white text-md hover:bg-pink-600 transition ease-in"
              >
                <RefreshCw className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
