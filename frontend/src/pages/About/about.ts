import { getAboutHTML,
         getAboutProjectHTML,
         getAboutUsHTML,
         getWebModuleHTML,
         getUserModuleHTML,
         getGameplayModuleHTML,
         getAiModuleHTML,
         getCybersecurityModuleHTML,
         getDevOpsModuleHTML,
         getAccessibilityModuleHTML,
         getServerSidePongModuleHTML,
         getMandatoryPartHTML,
         } from "./aboutTemplate";

export function About(): string {
  return getAboutHTML();
}

export function aboutHandlers() {
    
    const usBtn = document.getElementById("about-us-btn");
    const projectBtn = document.getElementById("about-project-btn");
    const aboutContent = document.getElementById("about-content");
    const moduleInfo = document.getElementById("module-info");
    const webModuleBtn = document.getElementById("web-module-btn");
    const userModuleBtn = document.getElementById("user-module-btn");
    const gameModuleBtn = document.getElementById("gameplay-module-btn");
    const aiModuleBtn = document.getElementById("ai-module-btn");
    const cyberModuleBtn = document.getElementById("security-module-btn");
    const devopsModuleBtn = document.getElementById("devops-module-btn");
    const accessModuleBtn = document.getElementById("access-module-btn");
    const serverPongModuleBtn = document.getElementById("serverPong-module-btn");
    const mandatoryBtn = document.getElementById("mandatory-module-btn");

    usBtn?.addEventListener("click", () => {
        if (aboutContent)
            aboutContent.innerHTML = getAboutUsHTML();
    })
    
    projectBtn?.addEventListener("click", () => {
        if (aboutContent) {
            aboutContent.innerHTML = getAboutProjectHTML();
            aboutHandlers();
        }
    })

    mandatoryBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getMandatoryPartHTML();
    })

    webModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getWebModuleHTML();
    })

    userModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getUserModuleHTML();
    })

    gameModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getGameplayModuleHTML();
    })

    aiModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getAiModuleHTML();
    })
            
    cyberModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getCybersecurityModuleHTML();
    })

    devopsModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getDevOpsModuleHTML();
    })

    accessModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getAccessibilityModuleHTML();
    })

    serverPongModuleBtn?.addEventListener("click", () => {
        if (moduleInfo)
            moduleInfo.innerHTML = getServerSidePongModuleHTML();
    })
}