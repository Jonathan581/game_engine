import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { GameObject } from './engine/GameObject.js';
import { Component } from './engine/Component.js';
import { Transform } from './engine/Transform.js';
import { MeshComponent } from './engine/MeshComponent.js';
import { LightComponent } from './engine/LightComponent.js';

// --- GameObject & Component System ---
let nextGameObjectId = 1;
const gameObjects = [];
const materials = [];

// --- Three.js Setup ---
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setClearColor(0x222222);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Add grid helper
const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
gridHelper.position.y = 0;
scene.add(gridHelper);

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);
resize(camera);
// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.screenSpacePanning = false;
controls.target.set(0, 0, 0);
controls.update();

// TransformControls
const transformControls = new TransformControls(camera, renderer.domElement);
scene.add(transformControls);
transformControls.addEventListener('dragging-changed', function (event) {
  controls.enabled = !event.value;
});

// Add transform mode buttons to inspector
const inspector = document.getElementById('inspector');
const modeDiv = document.createElement('div');
modeDiv.innerHTML = `
  <button id="mode-translate">Move</button>
  <button id="mode-rotate">Rotate</button>
  <button id="mode-scale">Scale</button>
`;
inspector.insertBefore(modeDiv, inspector.firstChild);
document.getElementById('mode-translate').onclick = () => transformControls.setMode('translate');
document.getElementById('mode-rotate').onclick = () => transformControls.setMode('rotate');
document.getElementById('mode-scale').onclick = () => transformControls.setMode('scale');

// Resize canvas
function resize(camera) {
  const viewport = document.getElementById('viewport');
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

}
window.addEventListener('resize', resize);
// Ensure resize runs after DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', resize);
} else {
  resize(camera);
}
// Optionally, observe viewport size changes (for flexbox or resizable layouts)
if (window.ResizeObserver) {
  const viewport = document.getElementById('viewport');
  const ro = new ResizeObserver(resize);
  ro.observe(viewport);
}

// --- Helpers ---
function createGameObject(name) {
  const go = new GameObject(name);
  gameObjects.push(go);
  updateSceneList();
  return go;
}

function addMeshToGameObject(go, mesh) {
  go.addComponent(new MeshComponent(go, mesh));
  scene.add(mesh);
  return mesh;
}

// --- Primitive Creation ---
function createPrimitive(type) {
  let geometry;
  switch (type) {
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 16);
      break;

    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(2, 2);
      break;
    default:
      return;
  }
  const material = materials[0] || new THREE.MeshStandardMaterial({ color: 0x4a90e2 });
  const mesh = new THREE.Mesh(geometry, material);
  const go = createGameObject(type.charAt(0).toUpperCase() + type.slice(1));
  addMeshToGameObject(go, mesh);
  return go;
}

// --- Light Creation ---
function createLight(type) {
  let light;
  let helper;
  switch (type) {
    case 'directional':
      light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 10, 7);
      helper = new THREE.DirectionalLightHelper(light, 1, 0xffff00);
      break;
    case 'point':
      light = new THREE.PointLight(0xffffff, 1, 100);
      light.position.set(0, 5, 0);
      helper = new THREE.PointLightHelper(light, 0.5, 0xffff00);
      break;
    case 'spot':
      light = new THREE.SpotLight(0xffffff, 1);
      light.position.set(0, 8, 8);
      helper = new THREE.SpotLightHelper(light, 0xffff00);
      break;
    default:
      return;
  }
  scene.add(light);
  if (helper) scene.add(helper);
  const go = createGameObject(type.charAt(0).toUpperCase() + ' Light');
  go.addComponent(new LightComponent(go, light, helper));
  return go;
}

// --- Material Creation ---
function createMaterial() {
  const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  const mat = new THREE.MeshStandardMaterial({ color });
  materials.push(mat);
  updateMaterialsList();
}

function updateMaterialsList() {
  const list = document.getElementById('materials-list');
  list.innerHTML = '';
  materials.forEach((mat, i) => {
    const btn = document.createElement('button');
    btn.textContent = `Material ${i+1}`;
    btn.style.background = mat.color.getStyle();
    btn.onclick = () => selectMaterial(i);
    list.appendChild(btn);
  });
}

let selectedMaterialIndex = 0;
function selectMaterial(i) {
  selectedMaterialIndex = i;
}

// --- UI Logic ---
document.querySelectorAll('button[data-primitive]').forEach(btn => {
  btn.onclick = () => {
    const go = createPrimitive(btn.dataset.primitive);
    selectGameObject(go.id);
  };
});
document.querySelectorAll('button[data-light]').forEach(btn => {
  btn.onclick = () => {
    const go = createLight(btn.dataset.light);
    selectGameObject(go.id);
  };
});
document.getElementById('create-material').onclick = createMaterial;

// --- Hierarchy Helpers ---
function getRootGameObjects() {
  return gameObjects.filter(go => !go.parent);
}

function traverseGameObject(go, callback, depth = 0) {
  callback(go, depth);
  go.children.forEach(child => traverseGameObject(child, callback, depth + 1));
}

// --- Scene List & Inspector ---
function updateSceneList() {
  const list = document.getElementById('scene-list');
  list.innerHTML = '';
  getRootGameObjects().forEach(go => renderGameObjectTree(go, list, 0));
}

function renderGameObjectTree(go, parentElem, depth) {
  const li = document.createElement('li');
  li.textContent = go.name;
  li.style.paddingLeft = (depth * 20) + 'px';
  li.onclick = (e) => {
    e.stopPropagation();
    selectGameObject(go.id);
  };
  if (go.id === selectedGameObjectId) li.classList.add('selected');

  // --- Drag and Drop ---
  li.draggable = true;
  li.ondragstart = (e) => {
    e.dataTransfer.setData('text/plain', go.id);
    li.classList.add('dragging');
  };
  li.ondragend = (e) => {
    li.classList.remove('dragging');
  };
  li.ondragover = (e) => {
    e.preventDefault();
    li.classList.add('drag-over');
  };
  li.ondragleave = (e) => {
    li.classList.remove('drag-over');
  };
  li.ondrop = (e) => {
    e.preventDefault();
    li.classList.remove('drag-over');
    const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
    if (draggedId === go.id) return; // Can't parent to self
    const draggedGo = gameObjects.find(g => g.id === draggedId);
    if (!draggedGo) return;
    if (go.isDescendantOf(draggedGo)) return; // Prevent cycles
    // Remove from old parent/root
    if (draggedGo.parent) draggedGo.parent.removeChild(draggedGo);
    else {
      const idx = gameObjects.indexOf(draggedGo);
      if (idx !== -1) gameObjects.splice(idx, 1);
    }
    // Add as child
    go.addChild(draggedGo);
    updateSceneList();
  };

  parentElem.appendChild(li);
  go.children.forEach(child => renderGameObjectTree(child, parentElem, depth + 1));
}

let selectedGameObjectId = null;
function selectGameObject(id) {
  selectedGameObjectId = id;
  updateSceneList();
  updateInspector();
  // Attach transform controls to mesh or light if available
  const go = gameObjects.find(g => g.id === selectedGameObjectId);
  if (go) {
    const meshComp = go.getComponent(MeshComponent);
    const lightComp = go.getComponent(LightComponent);
    if (meshComp) {
      transformControls.attach(meshComp.mesh);
      transformControls.visible = true;
    } else if (lightComp) {
      transformControls.attach(lightComp.light);
      transformControls.visible = true;
    } else {
      transformControls.detach();
      transformControls.visible = false;
    }
  } else {
    transformControls.detach();
    transformControls.visible = false;
  }
}

function updateInspector() {
  const content = document.getElementById('inspector-content');
  content.innerHTML = '';
  const go = gameObjects.find(g => g.id === selectedGameObjectId);
  if (!go) return;
  // Rename
  content.innerHTML += `<h3>Rename</h3><input id="rename-go" type="text" value="${go.name}"><button id="rename-btn">Rename</button>`;
  // Delete & Duplicate
  content.innerHTML += `<br><button id="delete-btn" style="background:#c0392b;">Delete</button> <button id="duplicate-btn">Duplicate</button><hr>`;
  // Show Transform
  const transform = go.getComponent(Transform);
  if (transform) {
    content.innerHTML += '<h3>Transform</h3>';
    ['x','y','z'].forEach(axis => {
      content.innerHTML += `Position ${axis.toUpperCase()}: <input type="number" step="0.1" id="pos-${axis}" value="${transform.position[axis]}" ><br>`;
    });
    ['x','y','z'].forEach(axis => {
      content.innerHTML += `Rotation ${axis.toUpperCase()}: <input type="number" step="0.1" id="rot-${axis}" value="${THREE.MathUtils.radToDeg(transform.rotation[axis])}" ><br>`;
    });
    ['x','y','z'].forEach(axis => {
      content.innerHTML += `Scale ${axis.toUpperCase()}: <input type="number" step="0.1" id="scale-${axis}" value="${transform.scale[axis]}" ><br>`;
    });
  }
  // Show Light properties if present
  const lightComp = go.getComponent(LightComponent);
  if (lightComp) {
    content.innerHTML += '<h3>Light</h3>';
    content.innerHTML += `Color: <input type="color" id="light-color" value="#${lightComp.light.color.getHexString()}"><br>`;
    content.innerHTML += `Intensity: <input type="number" step="0.1" id="light-intensity" value="${lightComp.light.intensity}"><br>`;
    if ('distance' in lightComp.light) {
      content.innerHTML += `Distance: <input type="number" step="0.1" id="light-distance" value="${lightComp.light.distance}"><br>`;
    }
    if ('angle' in lightComp.light) {
      content.innerHTML += `Angle: <input type="number" step="0.01" id="light-angle" value="${lightComp.light.angle}"><br>`;
    }
  }
  // Listeners for rename, delete, duplicate
  content.querySelector('#rename-btn').onclick = () => {
    const newName = content.querySelector('#rename-go').value.trim();
    if (newName) {
      go.name = newName;
      updateSceneList();
      updateInspector();
    }
  };
  content.querySelector('#delete-btn').onclick = () => {
    deleteGameObject(go);
    selectedGameObjectId = null;
    updateSceneList();
    updateInspector();
  };
  content.querySelector('#duplicate-btn').onclick = () => {
    const newGo = duplicateGameObject(go);
    if (go.parent) go.parent.addChild(newGo);
    else gameObjects.push(newGo);
    updateSceneList();
    selectGameObject(newGo.id);
  };
  // Listeners for transform
  if (transform) {
    ['x','y','z'].forEach(axis => {
      content.querySelector(`#pos-${axis}`).onchange = e => {
        transform.position[axis] = parseFloat(e.target.value);
      };
      content.querySelector(`#rot-${axis}`).onchange = e => {
        transform.rotation[axis] = THREE.MathUtils.degToRad(parseFloat(e.target.value));
      };
      content.querySelector(`#scale-${axis}`).onchange = e => {
        transform.scale[axis] = parseFloat(e.target.value);
      };
    });
  }
  // Listeners for light
  if (lightComp) {
    content.querySelector('#light-color').oninput = e => {
      lightComp.setColor(e.target.value);
    };
    content.querySelector('#light-intensity').onchange = e => {
      lightComp.setIntensity(parseFloat(e.target.value));
    };
    if ('distance' in lightComp.light) {
      content.querySelector('#light-distance').onchange = e => {
        lightComp.setDistance(parseFloat(e.target.value));
      };
    }
    if ('angle' in lightComp.light) {
      content.querySelector('#light-angle').onchange = e => {
        lightComp.setAngle(parseFloat(e.target.value));
      };
    }
  }
}

function deleteGameObject(go) {
  // Remove from parent's children or root list
  if (go.parent) go.parent.removeChild(go);
  else {
    const idx = gameObjects.indexOf(go);
    if (idx !== -1) gameObjects.splice(idx, 1);
  }
  // Remove children recursively
  go.children.slice().forEach(child => deleteGameObject(child));
  // Remove mesh from scene
  const meshComp = go.getComponent(MeshComponent);
  if (meshComp) scene.remove(meshComp.mesh);
}

function duplicateGameObject(go) {
  const newGo = new GameObject(go.name + ' Copy');
  // Copy transform
  const t = go.getComponent(Transform);
  const newT = newGo.getComponent(Transform);
  newT.position.copy(t.position);
  newT.rotation.copy(t.rotation);
  newT.scale.copy(t.scale);
  // Copy mesh
  const meshComp = go.getComponent(MeshComponent);
  if (meshComp) {
    const mesh = meshComp.mesh.clone();
    addMeshToGameObject(newGo, mesh);
  }
  // Copy children recursively
  go.children.forEach(child => {
    const newChild = duplicateGameObject(child);
    newGo.addChild(newChild);
  });
  return newGo;
}

// --- Animation Loop ---
function updateGameObjects() {
  gameObjects.forEach(go => {
    const meshComp = go.getComponent(MeshComponent);
    const transform = go.getComponent(Transform);
    if (meshComp && transform) {
      meshComp.mesh.position.copy(transform.position);
      meshComp.mesh.rotation.copy(transform.rotation);
      meshComp.mesh.scale.copy(transform.scale);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  updateGameObjects();
  controls.update();
  // Update helpers if needed
  gameObjects.forEach(go => {
    const comp = go.components.find(c => c && c.type === 'Light' && c.helper);
    if (comp && comp.helper) {
      if (comp.helper instanceof THREE.SpotLightHelper) {
        comp.helper.update();
      }
      // For Directional/Point helpers, position/rotation is auto-updated by Three.js
    }
  });
  renderer.render(scene, camera);
}

// --- Initial Scene ---
createLight('directional');
createPrimitive('plane');

animate();
updateSceneList();
updateMaterialsList();

// --- Raycasting for Selection ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let isTransformDragging = false;
transformControls.addEventListener('dragging-changed', function (event) {
  isTransformDragging = event.value;
  controls.enabled = !event.value;
});

canvas.addEventListener('pointerdown', onPointerDown);

function onPointerDown(event) {
  // Only left mouse button
  if (event.button !== 0) return;
  // Prevent selection if transformControls is dragging
  if (isTransformDragging) return;
  // Calculate mouse position in normalized device coordinates
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  // Collect all meshes
  const meshes = [];
  gameObjects.forEach(go => {
    const meshComp = go.getComponent(MeshComponent);
    if (meshComp) meshes.push(meshComp.mesh);
  });
  const intersects = raycaster.intersectObjects(meshes, false);
  if (intersects.length > 0) {
    // Find the GameObject for the first intersected mesh
    const mesh = intersects[0].object;
    const go = gameObjects.find(go => {
      const meshComp = go.getComponent(MeshComponent);
      return meshComp && meshComp.mesh === mesh;
    });
    if (go) selectGameObject(go.id);
  } else {
    // Deselect if clicking on empty space
    selectGameObject(null);
  }
}

// --- Sync TransformControls to GameObject Transform ---
transformControls.addEventListener('objectChange', () => {
  const mesh = transformControls.object;
  if (!mesh) return;
  // Find the GameObject for this mesh
  const go = gameObjects.find(go => {
    const meshComp = go.getComponent(MeshComponent);
    return meshComp && meshComp.mesh === mesh;
  });
  if (!go) return;
  const transform = go.getComponent(Transform);
  if (!transform) return;
  // Sync mesh transform to GameObject Transform
  transform.position.copy(mesh.position);
  transform.rotation.copy(mesh.rotation);
  transform.scale.copy(mesh.scale);
  // If this is the selected object, update inspector
  if (go.id === selectedGameObjectId) updateInspector();
});

const currentProject = "TestProject";

// Update the click handler to use the new functions

document.addEventListener("DOMContentLoaded", async () => {

  renderProjectExplorer();
});

document
.getElementById("import-files")
.addEventListener("click", async () => {
  try {
    const files = await window.api.browseFiles();
    if (files && files.length > 0) {
      await window.api.importFiles(currentProject, files);
      await renderProjectExplorer();
    }
  } catch (error) {
    console.error("Failed to import files:", error);
  }
});

async function renderProjectExplorer() {
  const container = document.querySelector(".project-files-grid");

  try {
    const files = await window.api.listProjectFiles(currentProject);

    // Clear existing files
    const fileTiles = container.querySelectorAll(".file-tile");
    fileTiles.forEach((tile) => tile.remove());

    // Add files
    for (const file of files) {
      const div = document.createElement("div");
      div.className = "file-tile";
      div.dataset.filename = file;

      const ext = file.split(".").pop().toLowerCase();
      const baseName = file.substring(0, file.lastIndexOf(".")) || file;

      if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) {
        // Previewable image files
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container";
        
        const img = document.createElement("img");
        img.className = "thumbnail-preview loading";
        
        // Add loading indicator
        const loadingIcon = document.createElement("div");
        loadingIcon.className = "loading-icon";
        loadingIcon.textContent = "⌛";
        imgContainer.appendChild(loadingIcon);

        // Handle image loading
        img.onload = () => {
          img.classList.remove("loading");
          loadingIcon.remove();
        };

        img.onerror = () => {
          loadingIcon.textContent = "🖼️";
          loadingIcon.className = "file-icon error";
          img.remove();
        };

        const fileUrl = await window.api.getFileUrl(currentProject, file);
        img.src = fileUrl;
        imgContainer.appendChild(img);
        div.appendChild(imgContainer);
      } else if (["mp3", "wav", "ogg"].includes(ext)) {
        // Sound files
        const icon = document.createElement("div");
        icon.className = "file-icon";
        icon.textContent = "🎵";
        div.appendChild(icon);
      } else if (["glb", "gltf"].includes(ext)) {
        // 3D model files
        const icon = document.createElement("div");
        icon.className = "file-icon";
        icon.textContent = "📦";
        div.appendChild(icon);
      } else {
        // Other file types
        const icon = document.createElement("div");
        icon.className = "file-icon";
        icon.textContent = "📄";
        div.appendChild(icon);
      }

      // Add editable text box for file name (without extension)
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "file-name";
      nameInput.value = baseName;
      nameInput.addEventListener("blur", async () => {
        const newName = nameInput.value.trim();
        if (newName && newName !== baseName) {
          const fullNewName = `${newName}.${ext}`;
          try {
            const success = await window.api.renameProjectFile(
              currentProject,
              file,
              fullNewName
            );
            if (success) {
              await renderProjectExplorer();
            } else {
              alert("Failed to rename the file. It may already exist.");
              nameInput.value = baseName;
            }
          } catch (error) {
            console.error("Error renaming file:", error);
            alert("An error occurred while renaming the file.");
            nameInput.value = baseName;
          }
        }
      });
      div.appendChild(nameInput);

      // Add context menu for delete
      div.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        showContextMenu(event, file);
      });

      container.appendChild(div);
    }
  } catch (error) {
    console.error("Failed to render project explorer:", error);
  }
}

function showContextMenu(event, fileName) {
  const existingMenu = document.querySelector(".context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.style.top = `${event.clientY}px`;
  menu.style.left = `${event.clientX}px`;

  const renameOption = document.createElement("div");
  renameOption.textContent = "Rename";
  renameOption.onclick = () => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = fileName;
    input.style.position = "absolute";
    input.style.top = `${event.clientY}px`;
    input.style.left = `${event.clientX}px`;
    input.style.zIndex = "1000";
    document.body.appendChild(input);

    input.focus();
    input.addEventListener("blur", async () => {
      const newName = input.value.trim();
      document.body.removeChild(input);
      if (newName && newName !== fileName) {
        try {
          const success = await window.api.renameProjectFile(
            currentProject,
            fileName,
            newName
          );
          if (success) {
            await renderProjectExplorer(); // Ensure the project explorer is refreshed
          } else {
            alert("Failed to rename the file. It may already exist.");
          }
        } catch (error) {
          console.error("Error renaming file:", error);
          alert("An error occurred while renaming the file.");
        }
      }
    });
  };

  const deleteOption = document.createElement("div");
  deleteOption.textContent = "Delete";
  deleteOption.onclick = async () => {
    if (confirm(`Delete ${fileName}?`)) {
      await window.api.deleteProjectFile(currentProject, fileName);
      await renderProjectExplorer();
    }
    menu.remove();
  };

  menu.appendChild(renameOption);
  menu.appendChild(deleteOption);
  document.body.appendChild(menu);

  document.addEventListener(
    "click",
    () => {
      if (menu.parentNode) {
        menu.remove();
      }
    },
    { once: true }
  );
}