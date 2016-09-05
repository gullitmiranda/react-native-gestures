import drag from './drag'
import pinch from './pinch'
import create from './create'
import draggable from './mixins/draggable'
import events from './mixins/events'
import GestureView from './GestureView'
import general from './responder/general'
import oneFinger from './responder/oneFinger'
import twoFinger from './responder/twoFinger'

// export { drag, pinch, create, draggable, events, GestureView }
export {
  drag,
  pinch,
  create,
  draggable,
  events,
  GestureView,
}
export let responders = {
  general,
  oneFinger,
  twoFinger
}