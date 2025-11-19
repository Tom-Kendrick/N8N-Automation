# AI Video Factory: The Simpsons Edition

> A chaotic, fun **n8n workflow** that automatically turns tech news headlines into short, vertically-oriented videos featuring a dialogue between **Bart (Junior Dev)** and **Homer (Senior Dev)**.

This project is a personal sandbox for connecting multiple AI, media processing, and DevOps tools to create a fully autonomous content pipeline. It's built primarily to see how far you can push a low-code platform like n8n for complex media production tasks. 

This project was built under strict student budget constraints, using free and low-cost solutions, which occasionally leads to a "clanky" feel. To keep costs down, the core infrastructure, including the n8n instance and the Gemini API access, was deployed using available student plans (like DigitalOcean). A "human-in-the-loop" step via Discord became necessary because most free audio generation tools couldn't provide the specific "famous" character voices (like Homer and Bart) required for the concept. This functionality, currently achieved using Parrot AI, is a key point of flexibility, as the characters can easily be adapted. A detailed explanation of how this Discord-based "human-in-the-loop" step operates follows later.

---

## How It Works

The workflow orchestrates several distinct steps, tying together APIs, shell commands, and custom logic to produce a single final video file.

1.  **News Ingestion:**
    * Pulls the latest tech news summary from an **RSS feed**.

2.  **Script Generation (Gemini API):**
    * The news is sent to the **Gemini API** with a strict prompt defining the persona of **Bart** (Hype-driven, buzzword enthusiast) and **Homer** (Skeptical, grounded engineer).
    * Gemini generates a five-scene dialogue, a clickbait title, and a YouTube description, all constrained to a single JSON object.

3.  **The Human Loop (Audio)**:
    * The raw script is sent to a private **Discord** channel.
    * The workflow pauses, waiting for a reply containing the five individual Text-to-Speech audio file URLs (acting as a "human in the loop" to select voices/style).

4.  **Media Processing (FFmpeg/FFprobe):**
    * Downloads a vertical **background video** (e.g., gameplay footage) and character PNGs for Homer and Bart.
    * The five audio files are stitched into one seamless MP3 track using **FFmpeg**'s `concat` command.
    * Each individual audio clip's length is measured using **FFprobe**. This data is crucial for the next step.

5.  **Caption & Overlay Timing:**
    * The final stitched audio is sent to **Deepgram** to generate accurate, word-by-word timestamped transcription.
    * Custom n8n Code nodes calculate the exact start and end time for every line of dialogue, which is then used to construct an **FFmpeg Filter String**.
    * The transcript is formatted into an **Aegisub (.ass) caption file** with dynamic font sizing.

6.  **Final Video Assembly:**
    * **FFmpeg** runs the main video assembly command, which:
        * Trims the background video from a **randomized starting point** (to avoid repetition).
        * Overlays the **Homer image** only when Homer is speaking, and the **Bart image** only when Bart is speaking, using the timing data from the filter string.
        * Bakes the generated `.ass` captions into the final video stream.

7.  **Delivery:**
    * The final video is uploaded to **Google Drive**.

---

## Huamn In The Loop (Detailed)

To circumvent the lack of free, high-quality character voice tools, the project incorporates a "human-in-the-loop" step utilising Parrot AI for generating the Homer and Bart voices. This process is initiated by the workflow sending the entire script to the user's personal Discord account via a dedicated bot, which includes a link to a form for submitting the final audio files. To increase efficiency, the manual process of copying the script and then the resulting audio URL was mostly automated using a Tampermonkey script. This automation streamlines the generation process, requiring the human operator only to validate the quality of the generated audio at each step and regenerate it if necessary.

---

## Key Technologies Used

| Tool | Purpose in Workflow |
| :--- | :--- |
| **n8n** | The primary orchestration engine and sequencer. |
| **Gemini API** | Generates the constrained JSON script, title, and metadata. |
| **FFmpeg / FFprobe** | The workhorses for all media operations (stitching audio, trimming video, adding overlays, and burning captions). |
| **Deepgram** | Generates highly accurate, timestamped transcription for captions. |
| **Discord** | Used as an optional "wait" node to integrate the Text-to-Speech process (the human/bot providing audio URLs). |
| **Google Drive** | Final cloud storage for the output video. |

---

## Status: Chaotic & Fun

This project is purely for experimentation. It is maintained sporadically and serves as a testing ground for integrating new APIs and finding the most roundabout, fun ways to automate media production.

## Follow the Chaos

See the final results of this automated pipeline (and the occasional human error) on the platforms below.

| Platform | Handle |
| :--- | :--- |
| **YouTube** | [@HomerKnowsWhy](https://www.youtube.com/@HomerKnowsWhy) |
| **Instagram** | [@homerknowswhy](https://www.instagram.com/homerknowswhy/) |
| **TikTok** | [@homerknowswhy](https://www.tiktok.com/@homerknowswhy) |
