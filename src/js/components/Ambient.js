/**
 * Ambient audio toggle.
 *
 * The MP3 is intentionally created on the first click (not at construction),
 * so a page load never downloads the 6.5 MB track.
 */

export default class Ambient {
  constructor(button) {
    this.button = button
    this.audio = null
    this.playing = false

    if (!button) return

    button.addEventListener('click', () => this.toggle())
  }

  /** Create the audio element on first user gesture, not on page load. */
  ensureAudio() {
    if (this.audio) return this.audio

    this.audio = new Audio('/audio/Lullabye.mp3')
    this.audio.loop = true
    this.audio.volume = 0.35
    this.audio.preload = 'none'

    return this.audio
  }

  async toggle() {
    const audio = this.ensureAudio()
    if (!audio) return

    if (this.playing) {
      this.audio.pause()
      this.playing = false
    } else {
      try {
        await this.audio.play()
        this.playing = true
      } catch (error) {
        console.error('Gagal memutar lagu:', error)
        return
      }
    }

    this.button.classList.toggle('is-on', this.playing)
    this.button.setAttribute('aria-pressed', String(this.playing))
  }
}
