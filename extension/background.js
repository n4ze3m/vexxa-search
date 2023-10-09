chrome.contextMenus.create({
  title: "Save url to Vexxa Search",
  id: "vexxa",
  contexts: ["page"],
});


const fetchCurrentSite = () => {
  const url = new URL(window?.location?.href);
  const entirePage = document.documentElement.outerHTML;
  return {
    url: url.href,
    content: entirePage,
  };
};

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId == "vexxa") {
    const tabId = tab.id;
    const response = await chrome.scripting.executeScript({
      target: {
        tabId: tabId,
      },
      func: fetchCurrentSite,
    });
    console.log(response);
    if (response.length !== 0) {
      const data = response[0]["result"];
      if (data) {
        console.log(data);
        const response = await fetch("http://localhost:3000/link/save", {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.status === 200) {
          const data = await response.json();
          console.log(data);
        }
      }
    }
  }
});
