import { useState } from "react";
import { YoutubePlayer } from "./components/YoutubePlayer";
import "./App.css";

function App() {
    const [videoId, setVideoId] = useState("dQw4w9WgXcQ"); // Default video (Rick Roll)
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setVideoId(inputValue.trim());
            setInputValue("");
        }
    };

    return (
        <div className="app-container">
            <h1>YouTube Player</h1>

            <div className="video-container">
                <YoutubePlayer videoId={videoId} />
            </div>

            <form onSubmit={handleSubmit} className="video-form">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter YouTube Video ID"
                />
                <button type="submit">Load Video</button>
            </form>

            <div className="info">
                <p>Current Video ID: {videoId}</p>
                <p>
                    <small>
                        Tip: The Video ID is the part after "v=" in a YouTube URL. For example, in
                        "https://www.youtube.com/watch?v=dQw4w9WgXcQ", the ID is "dQw4w9WgXcQ".
                    </small>
                </p>
            </div>
        </div>
    );
}

export default App;
