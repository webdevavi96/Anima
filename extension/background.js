chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed successfully");

  chrome.storage.local.set({
    background: "assets/background.mp4",
  });
});



