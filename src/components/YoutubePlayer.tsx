import YouTube from "react-youtube";
import type { YouTubeEvent } from "react-youtube";

interface YoutubePlayerProps {
    videoId: string;
    width?: string | number;
    height?: string | number;
}

export function YoutubePlayer({ videoId, width = "100%", height = "360" }: YoutubePlayerProps) {
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
        console.log("YouTube Player is ready:", event.target);
    };

    return (
        <div className="youtube-player-container">
            <YouTube videoId={videoId} opts={opts} onReady={onReady} iframeClassName="youtube-iframe" />
        </div>
    );
}
