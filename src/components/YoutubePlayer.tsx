import { useState } from "react";
import YouTube from "react-youtube";
import type { YouTubeEvent, YouTubePlayer as YTPlayer } from "react-youtube";

interface YoutubePlayerProps {
    videoId: string;
    width?: string | number;
    height?: string | number;
}

export function YoutubePlayer({ videoId, width = "100%", height = "360" }: YoutubePlayerProps) {
    const [player, setPlayer] = useState<YTPlayer | null>(null);

    const opts = {
        height,
        width,
        playerVars: {
            // https://developers.google.com/youtube/player_parameters
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
        },
    };

    const onReady = (event: YouTubeEvent) => {
        setPlayer(event.target);
        console.log("YouTube Player is ready:", event.target);
    };

    return (
        <div className="youtube-player-container">
            <YouTube videoId={videoId} opts={opts} onReady={onReady} />
            <div className="controls">
                <button onClick={() => player?.pauseVideo()}>Pause</button>
                <button onClick={() => player?.playVideo()}>Play</button>
            </div>
        </div>
    );
}
