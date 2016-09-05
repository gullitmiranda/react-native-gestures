import twoFingerResponder from './responder/twoFinger'
import { map } from 'transducers.js'

export default {
  responder: twoFingerResponder,
  transducer: map(function (gesture) {
    let layout = gesture.get('initialLayout')
    let startX = layout.get('x')
    let startY = layout.get('y')
    let startWidth = layout.get('width')
    let startHeight = layout.get('height')
    let newWidth = startWidth + gesture.get('increasedDistance')
    let scale = newWidth / startWidth
    let newHeight = startHeight * scale
    let xWidthDiff = (newWidth - startWidth) / 2
    let yHeightDiff = (newHeight - startHeight) / 2

    return {
      x: startX - gesture.getIn(['centerDiff', 'x']) - xWidthDiff,
      y: startY - gesture.getIn(['centerDiff', 'y']) - yHeightDiff,
      scale,
      width: newWidth,
      height: newHeight,
      rotate: gesture.get('angleChanged')
    }
  })
}
