document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name");
  const urlInput = document.getElementById("url");
  const saveBtn = document.getElementById("save");
  const error = document.getElementById("error");

  saveBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
      error.style.display = "block";
      return;
    }

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    chrome.storage.local.get({ links: [] }, (data) => {
      const links = data.links;

      links.push({ name, url });

      chrome.storage.local.set({ links }, () => {
        window.close();
      });
    });
  });
});
