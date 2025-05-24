const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  listProjectFiles: (projectName) =>
    ipcRenderer.invoke("list-project-files", { projectName }),
  getFileUrl: (projectName, fileName) =>
    ipcRenderer.invoke("get-file-url", projectName, fileName),
  importFiles: (projectName, filePaths) =>
    ipcRenderer.invoke("import-files", { projectName, files: filePaths }),
  browseFiles: () => ipcRenderer.invoke("browse-files"),
  renameProjectFile: (projectName, oldName, newName) =>
    ipcRenderer.invoke("rename-project-file", {
      projectName,
      oldName,
      newName,
    }),
  deleteProjectFile: (projectName, fileName) =>
    ipcRenderer.invoke("delete-project-file", { projectName, fileName }),
}); 