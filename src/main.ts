import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskType,
  // VoiceEmotion,
} from "@heygen/streaming-avatar";

// DOM elements
const videoElement = document.getElementById("avatarVideo") as HTMLVideoElement;
const startButton = document.getElementById("startSession") as HTMLButtonElement;
const endButton = document.getElementById("endSession") as HTMLButtonElement;
const speakButton = document.getElementById("speakButton") as HTMLButtonElement;
const interactionMode = document.getElementById("interactionMode") as HTMLSelectElement;
const userInput = document.getElementById("userInput") as HTMLInputElement;
const apiKeyInput = document.getElementById("apiKeyInput") as HTMLInputElement;
const setApiKeyButton = document.getElementById("setApiKeyButton") as HTMLButtonElement;
const editApiKeyButton = document.getElementById("editApiKeyButton") as HTMLButtonElement;

let avatar: StreamingAvatar | null = null;
let sessionData: any = null;

let apiKey_global = import.meta.env.VITE_HEYGEN_API_KEY;

// Disable start button initially
startButton.disabled = true;

// Function to update the .env file
function updateEnvFile(apiKey: string) {
  console.log(`Updating .env file with API key: ${apiKey}`);
  apiKey_global = apiKey;
}

// Handle setting the API key
function handleSetApiKey() {
  const apiKey = apiKeyInput.value;
  if (apiKey) {
    updateEnvFile(apiKey);
    apiKeyInput.disabled = true;
    setApiKeyButton.disabled = true;
    editApiKeyButton.disabled = false;
    startButton.disabled = false;
  }
}

// Handle editing the API key
function handleEditApiKey() {
  apiKeyInput.disabled = false;
  setApiKeyButton.disabled = false;
  editApiKeyButton.disabled = true;
  startButton.disabled = true;
}

// Helper function to fetch access token
async function fetchAccessToken(): Promise<string> {
  const response = await fetch(
    "https://api.heygen.com/v1/streaming.create_token",
    {
      method: "POST",
      headers: { "x-api-key": apiKey_global },
    }
  );

  const { data } = await response.json();
  return data.token;
}

// Initialize streaming avatar session
async function initializeAvatarSession() {
  const token = await fetchAccessToken();
  avatar = new StreamingAvatar({ token });

  sessionData = await avatar.createStartAvatar({
    quality: AvatarQuality.High,
    avatarName: "default",
  });
  // sessionData = await avatar.createStartAvatar({
  //   quality: AvatarQuality.High,
  //   avatarName: "9d677460eaab46438b20b03b206bbf7b",
  //   voice: {
  //     voiceId: "b283a6a522144eee8180184b5800279d",
  //     rate: 1, // 0.5 ~ 1.5
  //     emotion: VoiceEmotion.EXCITED,
  //   },
  // });

  console.log("Session data:", sessionData);

  // Enable end button and disable start button
  endButton.disabled = false;
  startButton.disabled = true;

  avatar.on(StreamingEvents.STREAM_READY, handleStreamReady);
  avatar.on(StreamingEvents.STREAM_DISCONNECTED, handleStreamDisconnected);
}

// Handle when avatar stream is ready
function handleStreamReady(event: any) {
  if (event.detail && videoElement) {
    videoElement.srcObject = event.detail;
    videoElement.onloadedmetadata = () => {
      videoElement.play().catch(console.error);
    };
  } else {
    console.error("Stream is not available");
  }
}

// Handle stream disconnection
function handleStreamDisconnected() {
  console.log("Stream disconnected");
  if (videoElement) {
    videoElement.srcObject = null;
  }

  // Enable start button and disable end button
  startButton.disabled = false;
  endButton.disabled = true;
}

// End the avatar session
async function terminateAvatarSession() {
  if (!avatar || !sessionData) return;

  await avatar.stopAvatar();
  videoElement.srcObject = null;
  avatar = null;
}

// Handle speaking event
async function handleSpeak() {
  if (avatar && userInput.value) {
    if (interactionMode.value === "speak") {
      console.log("speaking");
      await avatar.speak({
        text: userInput.value,
        task_type: TaskType.REPEAT,
      });
    }
    else if (interactionMode.value === "chat") {
      console.log("chatting");
      await avatar.speak({
        text: userInput.value,
      });
    }
    userInput.value = ""; // Clear input after speaking
  }
}

// Handle interaction mode change
interactionMode.addEventListener("change", () => {
  const mode = interactionMode.value;
  if (mode === "speak") {
    speakButton.textContent = "Speak";
    userInput.placeholder = "Type something to the avatar to speak...";
  } else if (mode === "chat") {
    speakButton.textContent = "Chat";
    userInput.placeholder = "Type something to chat with the avatar...";
  }
});

// Event listeners for buttons
startButton.addEventListener("click", initializeAvatarSession);
endButton.addEventListener("click", terminateAvatarSession);
speakButton.addEventListener("click", handleSpeak);
setApiKeyButton.addEventListener("click", handleSetApiKey);
editApiKeyButton.addEventListener("click", handleEditApiKey);