import { useRef, useEffect, useState, useCallback } from "react";
// Declare YT types globally or import if using a library like @types/youtube
declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

function App() {
    const playerRef = useRef<any>(null); // To hold the YT.Player instance
    const iframeRef = useRef<HTMLIFrameElement>(null); // Using iframe ref instead of div

    const [isApiReady, setIsApiReady] = useState(false);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [iframeId] = useState(`youtube-player-${Math.random().toString(36).substring(2, 11)}`); // Unique ID for iframe

    // Function to send status updates UP to the parent window
    const sendMessageToParent = useCallback((message: object) => {
        // SECURITY: Replace '*' with your parent app's specific origin in production
        window.parent.postMessage(message, "*");
        console.log("Sent message to parent:", message);
    }, []);

    // === YouTube API Loading and Player Initialization ===

    const onPlayerReady = useCallback(
        (event: any) => {
            console.log("YT Player Ready");
            setIsPlayerReady(true);
            setError(null);
            const currentDuration = event.target.getDuration() || 0;
            const currentTimestamp = event.target.getCurrentTime() || 0;
            setDuration(currentDuration);
            setCurrentTime(currentTimestamp);
            sendMessageToParent({
                type: "playerReady",
                duration: currentDuration,
                currentTime: currentTimestamp,
            });
        },
        [sendMessageToParent]
    );

    const onPlayerStateChange = useCallback(
        (event: any) => {
            const newState = event.data;
            console.log("YT Player State Change:", newState);
            const currentTimestamp = event.target.getCurrentTime() || 0;
            setCurrentTime(currentTimestamp);
            // Update duration in case it wasn't available before
            const currentDuration = event.target.getDuration() || 0;
            if (currentDuration && currentDuration !== duration) {
                setDuration(currentDuration);
            }

            sendMessageToParent({
                type: "stateChange",
                state: newState,
                currentTime: currentTimestamp,
                duration: currentDuration, // Send duration with state changes too
            });
        },
        [sendMessageToParent, duration]
    ); // Include duration in deps

    const onPlayerError = useCallback(
        (event: any) => {
            let errorMessage = "Unknown error";
            // Map YT error codes to messages (simplified)
            switch (event.data) {
                case 2:
                    errorMessage = "Invalid video ID";
                    break;
                case 5:
                    errorMessage = "HTML5 player error";
                    break;
                case 100:
                    errorMessage = "Video not found or removed";
                    break;
                case 101:
                case 150:
                    errorMessage = "Embedding disabled";
                    break;
            }
            console.error("YT Player Error:", event.data, errorMessage);
            setError(`Error ${event.data}: ${errorMessage}`);
            setIsPlayerReady(false); // Consider player unusable
            sendMessageToParent({
                type: "playerError",
                errorCode: event.data,
                message: errorMessage,
            });
        },
        [sendMessageToParent]
    );

    // Function to initialize the player once API is ready
    const initializePlayer = useCallback(() => {
        if (!isApiReady || !iframeId || playerRef.current) {
            console.log("Player init conditions not met:", {
                isApiReady,
                iframeId,
                playerExists: !!playerRef.current,
            });
            return;
        }
        console.log("Initializing YT Player using existing iframe:", iframeId);
        try {
            // Use the existing iframe instead of creating a new one
            playerRef.current = new window.YT.Player(iframeId, {
                events: {
                    onReady: onPlayerReady,
                    onStateChange: onPlayerStateChange,
                    onError: onPlayerError,
                },
                // We don't need to specify height, width, videoId, or playerVars
                // since they're already set on the iframe element
            });
            console.log("YT Player instance created:", playerRef.current);
        } catch (e: any) {
            console.error("Error initializing YT Player:", e);
            setError(`Init Error: ${e.message || "Unknown initialization error"}`);
            sendMessageToParent({
                type: "playerError",
                errorCode: "INIT_FAILED",
                message: e.message || "Unknown initialization error",
            });
        }
    }, [isApiReady, iframeId, onPlayerReady, onPlayerStateChange, onPlayerError, sendMessageToParent]);

    // Effect to load the YouTube IFrame API
    useEffect(() => {
        // Assign the callback to the window *before* loading the script
        window.onYouTubeIframeAPIReady = () => {
            console.log("YT IFrame API is ready");
            setIsApiReady(true);
        };

        // Check if script already exists
        if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
            const tag = document.createElement("script");
            tag.src = "https://www.youtube.com/iframe_api";
            document.body.appendChild(tag);
            console.log("YT IFrame API script added");
        } else {
            // If script exists but API not ready, maybe trigger manually if needed?
            // Or assume onYouTubeIframeAPIReady will fire eventually. For simplicity, just log.
            console.log("YT IFrame API script already exists.");
            // If YT object already exists, API might be ready immediately
            if (window.YT && window.YT.Player) {
                setIsApiReady(true);
            }
        }

        // Cleanup function to remove the global callback
        return () => {
            // delete window.onYouTubeIframeAPIReady; // Clean up might cause issues if component remounts fast
        };
    }, []); // Runs once on mount

    // Effect to initialize player once API is ready
    useEffect(() => {
        if (isApiReady) {
            // Give time for the iframe to be available in the DOM
            setTimeout(() => {
                initializePlayer();
            }, 100);
        }
    }, [isApiReady, initializePlayer]); // Run when API becomes ready

    // === Parent Window Message Handling ===

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // SECURITY: Check origin - Replace '*' with parent's origin
            // if (event.origin !== 'YOUR_PARENT_APP_ORIGIN') {
            //     console.warn("Ignoring message from unexpected origin:", event.origin);
            //     return;
            // }

            // Ensure message is from parent and player instance exists
            if (event.source === window.parent) {
                const data = event.data;
                console.log("Message received from parent window:", data);

                // Commands require the player instance
                if (!playerRef.current || !isPlayerReady) {
                    // Maybe queue commands or notify parent? For now, just log.
                    console.warn("Player not ready, ignoring command:", data.command);
                    // Optionally, tell parent player isn't ready for this command
                    // sendMessageToParent({ type: 'commandError', command: data.command, reason: 'Player not ready' });
                    return;
                }

                try {
                    switch (data.command) {
                        case "loadVideo":
                            if (data.videoId && typeof data.videoId === "string") {
                                playerRef.current.loadVideoById(data.videoId);
                            } else {
                                console.warn("Invalid 'loadVideo' command data:", data);
                            }
                            break;
                        case "play":
                            playerRef.current.playVideo();
                            break;
                        case "pause":
                            playerRef.current.pauseVideo();
                            break;
                        case "seekTo":
                            if (typeof data.time === "number") {
                                playerRef.current.seekTo(data.time, true); // Allow seek ahead
                            } else {
                                console.warn("Invalid 'seekTo' command data:", data);
                            }
                            break;
                        case "getCurrentTime":
                            try {
                                const currentTimestamp = playerRef.current.getCurrentTime() || 0;
                                // Send the current time back up to the parent
                                sendMessageToParent({ type: "currentTimeUpdate", currentTime: currentTimestamp });
                            } catch (e: any) {
                                console.error("Error getting current time:", e);
                                sendMessageToParent({
                                    type: "commandError",
                                    command: data.command,
                                    message: e.message || "Failed to get current time",
                                });
                            }
                            break;
                        // Add other commands from parent as needed (e.g., setVolume, mute)
                        default:
                            console.warn("Unknown command received from parent:", data.command);
                            break; // Ignore unknown commands
                    }
                } catch (e: any) {
                    console.error("Error executing player command:", data.command, e);
                    // Notify parent about the error executing the command
                    sendMessageToParent({
                        type: "commandError",
                        command: data.command,
                        message: e.message || "Failed to execute command",
                    });
                }
            }
            // Ignore messages from other sources (e.g., self, child iframes - shouldn't be any now)
        };

        window.addEventListener("message", handleMessage);

        // Clean up the event listener
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [isPlayerReady, sendMessageToParent]); // Depend on isPlayerReady to ensure playerRef.current methods exist

    return (
        <div>
            {/* Using a real iframe instead of a div for YouTube to use */}
            {/* <iframe
                id={iframeId}
                ref={iframeRef}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/?enablejsapi=1&origin=${window.location.origin}&controls=0&rel=0&playsinline=1`}
                title="YouTube Player"
                frameBorder="0"
                data-credentialless="true"
                {...({ credentialless: true } as any)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: "none", width: "100%", height: "100%" }}
            ></iframe> */}

            <iframe
                // credentialless
                data-credentialless="true"
                {...({ credentialless: true } as any)}
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/ovtz7__1UrI"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                style={{ border: "none", width: "100%", height: "100%" }}
            ></iframe>

            {/* Optional: Display status/error overlay for debugging */}
            {error && (
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(255,0,0,0.7)",
                        color: "white",
                        padding: "10px",
                        zIndex: 100,
                        textAlign: "center",
                    }}
                >
                    Player Error: {error}
                </div>
            )}
        </div>
    );
}

export default App;
