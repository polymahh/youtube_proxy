import { useState } from "react";
import { YoutubePlayer } from "./components/YoutubePlayer";

function App() {
    const [videoId] = useState("dQw4w9WgXcQ"); // Default video (Rick Roll)

    // yotube video player aspect ratio : 16/9

    return (
        <div style={{ width: "100%", height: "100%", aspectRatio: "16/9" }}>
            <YoutubePlayer videoId={videoId} />
        </div>
    );
}

export default App;
