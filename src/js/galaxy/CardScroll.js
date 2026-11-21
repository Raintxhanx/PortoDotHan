export function bindCardAutoAdvance(card, onNext, onPrev) {
  const body = card?.querySelector('.orbit-card__body')
  if (!body) return

  let cooling = false
  let touchY = 0

  const atBottom = () => body.scrollTop + body.clientHeight >= body.scrollHeight - 2
  const atTop = () => body.scrollTop <= 0

  const fire = (fn) => {
    if (cooling) return
    cooling = true
    fn()
    setTimeout(() => (cooling = false), 2200) // durasi GSAP + sedikit jeda
  }

  body.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && atBottom()) { e.preventDefault(); fire(onNext) }
    else if (e.deltaY < 0 && atTop()) { e.preventDefault(); fire(onPrev) }
    else e.stopPropagation() // scroll biasa di dalam card, jangan gerakkan dokumen
  }, { passive: false })

  body.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY }, { passive: true })
  body.addEventListener('touchend', (e) => {
    const dy = touchY - e.changedTouches[0].clientY
    if (dy > 50 && atBottom()) fire(onNext)
    else if (dy < -50 && atTop()) fire(onPrev)
  })
}
