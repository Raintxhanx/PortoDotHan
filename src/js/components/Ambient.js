/**
 * A small generative ambient pad — no audio files, just WebAudio.
 * Two detuned drones, a slow filter sweep and a very quiet fifth.
 */

export default class Ambient {
  constructor(button) {
    this.button = button
    this.audio = null
    this.playing = false

    if (!button) return

    this.audio = new Audio('/audio/Lullabye.mp3')
    this.audio.loop = true
    this.audio.volume = 0.35
    this.audio.preload = 'auto'

    button.addEventListener('click', () => this.toggle())
  }

  async toggle() {
    if (!this.audio) return

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
