// ==UserScript==
// @name         ParrotAI Script Automation for Homer/Bart
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Automates navigation, text injection, auto-generation, and source collection for sequential voice generation.
// @author       Gemini
// @match        https://www.tryparrotai.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';


    const SCRIPT_TEXT_STORAGE_KEY = 'ParrotAIScriptText';
    const CURRENT_LINE_INDEX_KEY = 'ParrotAICurrentLineIndex';
    const COLLECTED_SOURCES_KEY = 'ParrotAICollectedSources';
    const BASE_APP_URL = 'https://www.tryparrotai.com/app/'; 

    const VOICE_URLS = {
        Bart: 'https://www.tryparrotai.com/app/create?text={}&p=1&vid=b6cfe79e-b158-4cdc-96dd-4d15acd7936f',
        Homer: 'https://www.tryparrotai.com/app/create?text={}&p=1&vid=24b87e67-5484-4645-8608-57230362ff39'
    };

    const SELECTORS = {
        GENERATE_BUTTON: "#action > div > button",
        TARGET_CHECKBOX: "#action > div > div.form-control > label > div:nth-child(1) > input",
        VIDEO_ELEMENT: "#action > div > section > div > div > video"
    };


    function createUI() {
        let scriptText = GM_getValue(SCRIPT_TEXT_STORAGE_KEY, '');
        let currentLineIndex = GM_getValue(CURRENT_LINE_INDEX_KEY, 0);

        const panel = document.createElement('div');
        panel.id = 'automation-panel';
        panel.innerHTML = `
            <h3 style="margin-top: 0;">AI Audio Generator (Homer/Bart)</h3>
            <textarea id="script-input" rows="10" placeholder="Paste script here (Character: Dialogue line)">${scriptText}</textarea>
            <div id="controls-area" style="margin-top: 10px;">
                <button id="start-button" class="action-btn" style="background-color: #4CAF50;">Start/Resume Generation</button>
                <button id="continue-button" class="action-btn" style="background-color: #2196F3;" disabled>Continue to Next Line</button>
                <button id="finish-button" class="action-btn" style="background-color: #9C27B0;">Finish and View Sources</button>
                <button id="reset-button" class="action-btn" style="background-color: #f44336;">Reset Progress</button>
            </div>
            <p id="status-message" style="margin-top: 10px; font-weight: bold;"></p>
        `;
        document.body.appendChild(panel);

        GM_addStyle(`
            #automation-panel {
                position: fixed;
                bottom: 10px;
                left: 10px;
                width: 350px;
                padding: 15px;
                background-color: #333; /* Dark background for visibility */
                color: white;
                border: 2px solid #ff9900; /* Simpsons yellow/orange */
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
                z-index: 9999;
                font-family: Arial, sans-serif;
            }
            #script-input {
                width: 100%;
                box-sizing: border-box;
                padding: 5px;
                border: 1px solid #ccc;
                background-color: #444;
                color: white;
                resize: vertical;
            }
            .action-btn {
                padding: 8px 12px;
                margin-right: 5px;
                margin-bottom: 5px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: background-color 0.2s;
            }
            .action-btn:hover:enabled {
                filter: brightness(1.2);
            }
            .action-btn:disabled {
                background-color: #888 !important;
                cursor: not-allowed;
            }
        `);

        document.getElementById('script-input').addEventListener('input', updateScriptStorage);
        document.getElementById('start-button').addEventListener('click', startGeneration);
        document.getElementById('continue-button').addEventListener('click', continueGeneration);
        document.getElementById('reset-button').addEventListener('click', resetProgress);
        document.getElementById('finish-button').addEventListener('click', finishAndDisplaySources);

        updateStatus(currentLineIndex, scriptText);
    }


    function updateScriptStorage() {
        const scriptInput = document.getElementById('script-input').value;
        GM_setValue(SCRIPT_TEXT_STORAGE_KEY, scriptInput);
    }

    function getScriptLines(scriptText) {
        return scriptText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && line.includes(':'));
    }

    function parseLine(line) {
        const parts = line.split(':');
        if (parts.length < 2) return null;

        const character = parts[0].trim();
        const dialogue = parts.slice(1).join(':').trim();

        const encodedText = dialogue.replace(/\s/g, '+').replace(/{/g, '').replace(/}/g, '');

        if (!VOICE_URLS[character]) {
            console.error(`Unknown character or voice ID in line: ${line}`);
            return null;
        }

        const url = VOICE_URLS[character].replace('{}', encodedText);
        return { character, dialogue, url };
    }

    function updateStatus(index, scriptText) {
        const lines = getScriptLines(scriptText);
        const statusEl = document.getElementById('status-message');
        const continueBtn = document.getElementById('continue-button');
        const startBtn = document.getElementById('start-button');

        if (!statusEl || !continueBtn || !startBtn) return;

        if (lines.length === 0) {
            statusEl.textContent = "Status: Paste script and click Start.";
            continueBtn.disabled = true;
            startBtn.disabled = false;
            return;
        }

        if (index >= lines.length) {
            statusEl.textContent = `✅ Generation Complete! ${lines.length} lines processed.`;
            continueBtn.disabled = true;
            startBtn.disabled = true;
            return;
        }

        const currentLine = lines[index];
        const parsed = parseLine(currentLine);

        if (window.location.href.includes('tryparrotai.com/app/create')) {
            continueBtn.disabled = false;
            startBtn.disabled = true;
            statusEl.innerHTML = `Status: Ready for **${parsed ? parsed.character : 'Unknown'}**<br>Line ${index + 1}/${lines.length}: "${parsed ? parsed.dialogue.substring(0, 30) + '...' : 'Parsing Error'}"`;
        } else {
            continueBtn.disabled = true;
            startBtn.disabled = false;
            statusEl.textContent = `Status: Ready to start from Line ${index + 1}/${lines.length}.`;
        }
    }


    function clickGenerateButton() {
        const MAX_RETRIES = 20; 
        const RETRY_INTERVAL = 500;
        let retries = 0;

        const INITIAL_WAIT_MS = 5000;

        setTimeout(() => {
            const intervalId = setInterval(() => {
                const generateButton = document.querySelector(SELECTORS.GENERATE_BUTTON);

                if (generateButton) {
                    clearInterval(intervalId);
                    generateButton.click();
                    console.log("Automation: Successfully clicked the Generate button.");
                } else if (retries >= MAX_RETRIES) {
                    clearInterval(intervalId);
                    console.warn("Automation: Failed to find/click Generate button after maximum retries.");
                }
                retries++;
            }, RETRY_INTERVAL);
        }, INITIAL_WAIT_MS);
    }

    function captureSourceIfAvailable(navigateNextCallback) {
        const MAX_CAPTURE_RETRIES = 30; 
        const RETRY_INTERVAL = 500;
        let retries = 0;
        const continueBtn = document.getElementById('continue-button');

        if (continueBtn && navigateNextCallback) continueBtn.disabled = true;

        const captureIntervalId = setInterval(() => {
            const videoElement = document.querySelector(SELECTORS.VIDEO_ELEMENT);

            if (videoElement && videoElement.src && videoElement.src.startsWith('https://')) {
                clearInterval(captureIntervalId);

                const currentSources = GM_getValue(COLLECTED_SOURCES_KEY, []);
                if (currentSources.length === 0 || currentSources[currentSources.length - 1] !== videoElement.src) {
                    currentSources.push(videoElement.src);
                    GM_setValue(COLLECTED_SOURCES_KEY, currentSources);
                    console.log(`Captured video source: ${videoElement.src}`);
                }

                if (navigateNextCallback) {
                    navigateNextCallback(); 
                } else {
                    if (continueBtn) continueBtn.disabled = false;
                }

            } else if (retries >= MAX_CAPTURE_RETRIES) {
                clearInterval(captureIntervalId);
                console.error("CAPTURE FAILED: Video source (src) not found after 15 seconds. Proceeding with navigation/finish.");
                if (continueBtn) continueBtn.disabled = false;

                if (navigateNextCallback) {
                    navigateNextCallback();
                }

            } else {
                 console.log(`Waiting for video source... Attempt ${retries + 1}. Current src: ${videoElement ? videoElement.src : 'null'}`);
            }
            retries++;
        }, RETRY_INTERVAL);
    }

    function navigateNext(index, scriptText) {
        const lines = getScriptLines(scriptText);

        if (index >= lines.length) {
            updateStatus(index, scriptText);
            alert("All lines processed. Click 'Finish and View Sources' to get your URLs.");
            return;
        }

        const parsed = parseLine(lines[index]);

        if (parsed) {
            console.log(`Loading Line ${index + 1}: ${parsed.character} - "${parsed.dialogue}"`);
            GM_setValue(CURRENT_LINE_INDEX_KEY, index + 1);
            window.location.href = parsed.url;
        } else {
            alert(`Error processing line ${index + 1}. Please check the format (Character: Dialogue).`);
        }
    }


    function pageLoadAutomation() {
        if (!window.location.href.includes('tryparrotai.com/app/create')) {
            return;
        }

        const targetCheckbox = document.querySelector(SELECTORS.TARGET_CHECKBOX);

        if (targetCheckbox && !targetCheckbox.checked) {
            targetCheckbox.click();
            console.log("Automation: Target checkbox checked.");
        }

        clickGenerateButton();
    }

    function startGeneration() {
        const scriptText = GM_getValue(SCRIPT_TEXT_STORAGE_KEY, '');
        const lines = getScriptLines(scriptText);
        if (lines.length === 0) {
            alert("Please paste the dialogue script into the text box first.");
            return;
        }
        GM_setValue(COLLECTED_SOURCES_KEY, []);
        GM_setValue(CURRENT_LINE_INDEX_KEY, 0);

        navigateNext(0, scriptText); 
    }

    function continueGeneration() {
        const scriptText = GM_getValue(SCRIPT_TEXT_STORAGE_KEY, '');
        const index = GM_getValue(CURRENT_LINE_INDEX_KEY, 0);

        const navigateCallback = () => {
             navigateNext(index, scriptText);
        };

        captureSourceIfAvailable(navigateCallback);
    }

    function resetProgress() {
        GM_setValue(CURRENT_LINE_INDEX_KEY, 0);
        GM_setValue(COLLECTED_SOURCES_KEY, []); 

        window.location.href = BASE_APP_URL;
    }

    function finishAndDisplaySources() {

        const finishBtn = document.getElementById('finish-button');
        if (finishBtn) finishBtn.disabled = true;

        captureSourceIfAvailable(() => {
            if (finishBtn) finishBtn.disabled = false;

            const sources = GM_getValue(COLLECTED_SOURCES_KEY, []);
            const currentLineIndex = GM_getValue(CURRENT_LINE_INDEX_KEY, 0);
            let output = sources.join('\n');

            let headerText = `Collected Audio Sources (${sources.length})`;

            if (sources.length === 0) {
                output = "No video sources were collected yet. Start the process and click 'Continue' after each audio generation.";
            } else {
                const totalLines = getScriptLines(GM_getValue(SCRIPT_TEXT_STORAGE_KEY, '')).length;
                headerText = `Collected Sources (${sources.length} / ${totalLines} Lines Processed)`;
            }

            const modal = document.createElement('div');
            modal.id = 'source-modal';
            modal.innerHTML = `
                <div style="padding: 20px; background: white; border-radius: 8px; max-width: 600px; margin: 50px auto; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <h3 style="color: black; margin-top: 0;">${headerText}</h3>
                    <textarea style="width: 100%; height: 300px; border: 1px solid #ccc; padding: 10px; font-size: 12px; color: black; box-sizing: border-box;" readonly>${output}</textarea>
                    <button id="close-modal-btn" class="action-btn" style="background-color: #f44336; color: white;">Close</button>
                    <button id="clear-sources-btn" class="action-btn" style="background-color: #FFC107; color: black;">Clear Collected Sources</button>
                </div>
            `;

            GM_addStyle(`
                #source-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            `);

            document.body.appendChild(modal);

            document.getElementById('close-modal-btn').addEventListener('click', () => modal.remove());
            document.getElementById('clear-sources-btn').addEventListener('click', () => {
                GM_setValue(COLLECTED_SOURCES_KEY, []);
                alert("Sources cleared! The panel must be reset to start a new session.");
                modal.remove();
            });
        });
    }


    createUI();
    pageLoadAutomation();
})();