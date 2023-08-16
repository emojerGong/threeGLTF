import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer;
const btnText = [' ON ', 'OFF'];
let btnStatus = false; // false => off, true => on, default on

init();
render();

function init() {
    const container = document.createElement('div');
    const btn = document.createElement('button');
    btn.id = 'lightBtn';
    btn.innerText = btnText[1];
    container.appendChild(btn);
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.set(0, 5, 20);

    const targetPosition = new THREE.Vector3(0, 15, 0); // 设置焦点位置
    camera.lookAt(targetPosition);

    camera.zoom = 0.5; // 设置缩放级别，较小的值会导致放大效果，较大的值会导致缩小效果
    camera.updateProjectionMatrix(); // 更新相机的投影矩阵，以应用缩放

    scene = new THREE.Scene();

    // light
    const globalLight = new THREE.PointLight(0xffffff, 200); // 参数分别为颜色和强度
    globalLight.position.set(0, 10, 0);
    scene.add(globalLight);

    // model
    const loader = new GLTFLoader().setPath('public/scene/');
    loader.load('scene.gltf', function (gltf) {
        const model = gltf.scene;
        model.rotation.y = -Math.PI / 2;
        model.position.set(-1.5, -2, 0);

        /** ↓↓↓ 可抽象的内容（僅提供參考，function根據具體需求更改） ↓↓↓ */
        // 獲取燈泡對象（後面要抽象出來function的話，要建模師配合將命名固定
        const glowingChild = model.getObjectByName('Sphere_6');

        // 獲取該燈泡在scene的位置
        // 不能用glowingChild.position，該position為燈泡相對於模型的位置
        const glowingChildPos = new THREE.Vector3();
        glowingChild.getWorldPosition(glowingChildPos);

        // 设置燈泡默認發光强度
        // 在threejs裏面，燈泡（物體）材質的發光强度不能視爲一個光源，即無論調到多亮，它的亮度對於其他物體是不發光的。
        glowingChild.children[0].material.emissiveIntensity = 0;

        // （二選一）基於上訴定調，创建点光源，并设置位置在获取到的位置上
        // const pointLight = new THREE.PointLight(0xffffff, 100, 100);
        // pointLight.visible = false;
        // pointLight.position.copy(glowingChildPos);
        // pointLight.position.y -= 1;

        // 基於上訴定調，创建聚光燈，并设置位置在获取到的位置上
        const pointLight = new THREE.SpotLight(
            0xffffff,
            100,
            100,
            Math.PI / 4,
            0.5
        ); // 参数依次为颜色、强度、距离、内锥角、外锥角
        pointLight.position.copy(glowingChildPos); // 设置聚光灯的位置
        pointLight.target.position.set(glowingChildPos.x, 0, glowingChildPos.z); // 设置聚光灯的目标位置
        scene.add(pointLight); // 将聚光灯添加到场景中

        scene.add(pointLight);
        scene.add(model);
        render();

        btn.onclick = () => {
            if (btnStatus) {
                // 關燈 off
                btn.innerText = btnText[1];
                pointLight.visible = false;
                glowingChild.children[0].material.emissiveIntensity = 0;
                camera.updateProjectionMatrix();
                render();
            } else {
                // 關燈 on
                btn.innerText = btnText[0];
                pointLight.visible = true;
                glowingChild.children[0].material.emissiveIntensity = 1;
                camera.updateProjectionMatrix();
                render();
            }
            btnStatus = !btnStatus;
        };
        /** ↑↑↑ 可抽象的内容 ↑↑↑ */
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, -0.2);
    controls.update();

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

    render();
}

//

function render() {
    renderer.render(scene, camera);
}
