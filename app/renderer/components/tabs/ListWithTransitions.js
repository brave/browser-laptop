import React, { Children, cloneElement, Component } from 'react'
import { findDOMNode } from 'react-dom'
import { getNodeOffsetPosition, removeNodeFromDOMFlow } from '../../lib/domUtil'

/**
 * Uses the FLIP technique to find out where children were rendered, then
 * move them back to their previous positions and transition back to the
 * new postiions. Also applies enter and leave animations.
 * FLIP - https://aerotwist.com/blog/flip-your-animations/
 * Child lifecycle management inspired by https://github.com/joshwcomeau/react-flip-move
 *
 * @class ListWithTransitions
 * @extends {Component}
 */
class ListWithTransitions extends Component {
  constructor (...args) {
    super(...args)
    this.state = {
      children: Children.toArray(this.props.children)
        .map(element =>
          Object.assign({}, element, {
            appearing: true
          }))
    }
    console.log(this.state.children)
    this.childrenData = {}
    this.parentData = {
      domNode: null,
      boundingBox: null
    }
    this.heightPlaceholderData = {
      domNode: null
    }
    this.remainingAnimations = 0
    this.childrenThatAnimated = []
  }

  /**
   * Computes and attaches keyframes to child Components' domNodes,
   * calling any provided onStart or onFinish hooks
   *
   * @memberof ListWithTransitions
   */
  animateChildren () {
    const {
      appearAnimation,
      enterAnimation,
      leaveAnimation,
      staggerDelayBy,
      duration,
      delay,
      easing
    } = this.props
    // measure parent offset each time, as that could be moving around too
    const parentBoundingBox = this.parentData.domNode.getBoundingClientRect()
    // we're going to prevent staggered animations if there are any
    // items being added or removed, since changing the number of items
    // in a list can affect the positions of list items and it can be
    // strange to stagger width changes of all items caused by a single
    // item. Staggering animations are good to show that multiple events are happening
    // but in those cases on single events have occured.
    let staggeredAllowed = true
    // animate each child, if neccessary
    for (const child of this.state.children) {
      const childData = this.getChildData(child.key)
      // manual override for child element to prevent transitions
      // e.g. if element is being dragged
      if (childData.domNode.getAttribute('data-prevent-transitions') === 'true') {
        continue
      }
      // build up animation arguments
      let keyFrames = null
      let animationDelay = 0
      if (child.appearing) {
        staggeredAllowed = false
        // animate appearing, if configured
        if (appearAnimation) {
          keyFrames = appearAnimation
        }
      } else if (child.entering) {
        staggeredAllowed = false
        // animate entering, if configured
        if (enterAnimation) {
          keyFrames = enterAnimation
        }
      } else if (child.leaving) {
        staggeredAllowed = false
        // animate leaving, if configured and haven't started it yet
        if (!childData.left && leaveAnimation) {
          // Keep the element so it can be animated away,
          // But allow the container to collapse / the siblings to take its place
          // with position 'absolute'
          removeNodeFromDOMFlow(childData.domNode, this.props.bottomAligned)
          keyFrames = leaveAnimation
          // remember that we have animated the child out,
          // so that we don't repeat it when receiving new props
          // before the animation has completed
          this.setChildData(child.key, { left: true })
        }
      } else {
        // animate position movement
        // actual intended position (not bounding box as element may already be animating from a previous move)
        // if we just compared intended position with bounding box (which would include animated offset position),
        // then we would cause jank by pausing and starting animation whenever props change
        const childActualRect = getNodeOffsetPosition(childData.domNode)
        // compare to previous actual position
        if (childData.previousPosition) {
          let deltaX = childData.previousPosition.x - childActualRect.x
          let deltaY = childData.previousPosition.y - childActualRect.y
          if (deltaX || deltaY) {
            // check if currently animating, then delta should be from where currently is
            if (childData.currentAnimation) {
              // use Bounding rect as that will include the translate() position
              const currentBoundingRect = childData.domNode.getBoundingClientRect()
              const boundingX = Math.round(currentBoundingRect.x - parentBoundingBox.x)
              const boundingY = Math.round(currentBoundingRect.y - parentBoundingBox.y)
              // to avoid a jump when the node is changed position in the list
              // we must add on a translation to the offset from the original location
              const offsetX = boundingX - childActualRect.x
              const offsetY = boundingY - childActualRect.y
              // add the difference between the new position and the original position, plus the offset
              // that should get us back to the place of the previous animation
              deltaX = deltaX + offsetX
              deltaY = deltaY + offsetY
            }
            // children can prevent themselves moving in a particular direction
            const preventMoveRight = childData.domNode.getAttribute('data-prevent-transition-move-right') === 'true'
            if (
              !preventMoveRight || // allowed to move right
              (preventMoveRight && deltaX > 0) // not allowed to move right, but element is moving left
            ) {
              keyFrames = [
                {
                  transform: `translate(${deltaX}px, ${deltaY}px)`
                },
                {
                  transform: 'translate(0, 0)'
                }
              ]
              // if requested, stagger the delay, but not if the element is already animating
              if (staggeredAllowed && staggerDelayBy) {
                const staggerBehindCount = Math.max(0, this.remainingAnimations - 1)
                animationDelay = childData.currentAnimation ? 0 : (staggerBehindCount * staggerDelayBy)
              }
            }
          }
        }
      }
      if (keyFrames) {
        // save for notifications
        this.childrenThatAnimated.push(child.key)

        // delay?
        animationDelay += delay

        // if there's an existing animation, pause or cancel it and new one will take over
        if (childData.currentAnimation) {
          childData.currentAnimation.cancel()
        } else {
          this.remainingAnimations += 1
        }

        // if there's a delay, hold the item at the start position while we wait
        let manualStyleProperties = []
        if (animationDelay) {
          // find first keyframe
          // TODO: support more keyframe types than arrays, so that if we're passed
          // a different type *and* a delay, for an animation not generated in this function
          // then we can parse it
          let initialKeyFrame = Array.isArray(keyFrames) ? keyFrames[0] : null
          if (initialKeyFrame) {
            for (const propertyName in initialKeyFrame) {
              manualStyleProperties.push(propertyName)
              childData.domNode.style.setProperty(propertyName, initialKeyFrame[propertyName])
            }
          }
        }

        // do the actual animation
        const animation = childData.domNode.leavingAnimation = childData.domNode.animate(keyFrames, {
          easing,
          delay: animationDelay,
          duration: duration
        })

        // save the animation for later so that we can cancel it if another one comes along
        this.setChildData(child.key, { currentAnimation: animation })
        animation.onfinish = ev => {
          this.setChildData(child.key, { currentAnimation: null })
          // Trigger any onFinish/onFinishAll hooks passed from parent Components
          this.triggerFinishHooks(child, childData.domNode)
          // Clear any initial holding style state
          if (manualStyleProperties.length) {
            for (const propertyName of manualStyleProperties) {
              childData.domNode.style.removeProperty(propertyName)
            }
          }
          // for elements that are animating out, we can now finally
          // delete the dom node
          if (child.leaving) {
            this.removeChildData(child.key)
          }
        }
        // when cancelled, we don't need to reset the currentAnimation cache
        // since it should only get cancelled by another animation
        animation.oncancel = ev => {
          // Clear any initial holding style state
          if (manualStyleProperties.length) {
            for (const propertyName of manualStyleProperties) {
              childData.domNode.style.removeProperty(propertyName)
            }
          }
        }
      }
    }

    if (typeof this.props.onStartAll === 'function') {
      this.callChildrenHook(this.props.onStartAll)
    }
  }

  componentDidMount () {
    // props.appearAnimation runs on each child at mount
    // of this Component, if provided
    const shouldAnimate = this.props.appearAnimation && !this.isAnimationDisabled(this.props)

    if (shouldAnimate) {
      this.animateChildren()
    }
  }

  componentWillReceiveProps (nextProps) {
    // Get position before we make any animations
    // We need to look at the latest possible time,
    // and cannot cache from last time since movement could have
    // occured outside our control in between animations
    for (const child of this.state.children) {
      const { domNode } = this.getChildData(child.key)
      this.setChildData(child.key, { previousPosition: getNodeOffsetPosition(domNode) })
    }
    // Replace children in the state with the new ones coming in, but hang on to the removed ones
    // whilst we animate them out
    const nextChildren = Children.toArray(nextProps.children)
    this.setState({
      children: this.isAnimationDisabled(nextProps)
        ? nextChildren.map(element => Object.assign({}, element))
        : this.calculateNextSetOfChildren(nextChildren)
    })
  }

  componentDidUpdate (previousProps) {
    // If any children Components have been re-arranged, added, or removed,
    // parse for animations
    const oldChildrenKeys = Children.toArray(this.props.children).map(d => d.key)
    const nextChildrenKeys = Children.toArray(previousProps.children).map(d => d.key)
    const keysEqual =
      oldChildrenKeys.length === nextChildrenKeys.length &&
      oldChildrenKeys.every((key, index) => key === nextChildrenKeys[index])
    const shouldAnimate = !keysEqual && !this.isAnimationDisabled(this.props)
    if (shouldAnimate) {
      this.animateChildren()
    }
  }

  /**
   * Compare incoming children with existing children and
   * decide which old ones are 'leaving' and which new ones are 'entering'
   */
  calculateNextSetOfChildren (nextChildren) {
    // we're going to create a new list of child components, cloning the components
    // mark children as 'entering' if we did not already know about them
    const updatedChildren = nextChildren.map(nextChild => {
      const existingChild = this.findChildByKey(nextChild.key)
      const isEntering = !existingChild || existingChild.leaving
      return Object.assign({}, nextChild, { entering: isEntering })
    })
    // Find children that we knew of but are no longer present,
    // and mark them as 'leaving'
    // Insert them *back* in to the list of components at their previous
    // index.
    let numOfChildrenLeaving = 0
    this.state.children.forEach((child, index) => {
      const isLeaving = !nextChildren.some(({ key }) => key === child.key)
      // We only need to add it back to the list of components if we are asked to provide animation
      if (!isLeaving || !this.props.leaveAnimation) {
        return
      }
      const nextChild = Object.assign({}, child, { leaving: true })
      const nextChildIndex = index + numOfChildrenLeaving

      updatedChildren.splice(nextChildIndex, 0, nextChild)
      numOfChildrenLeaving += 1
    })

    return updatedChildren
  }

  triggerFinishHooks (child, domNode) {
    if (this.props.onFinish) this.props.onFinish(child, domNode)

    // Reduce the number of children we need to animate by 1,
    // so that we can tell when all children have finished.
    this.remainingAnimations -= 1

    if (this.remainingAnimations === 0) {
      // Remove any items from the DOM that have left, and reset `entering`.
      const nextChildren =
        this.state.children.filter(({ leaving }) => !leaving)
        .map(item => Object.assign({}, item, {
          appearing: false,
          entering: false
        }))

      this.setState({ children: nextChildren }, () => {
        if (typeof this.props.onFinishAll === 'function') {
          this.callChildrenHook(this.props.onFinishAll)
        }
        // Reset for the next iteration
        this.childrenThatAnimated = []
      })
    }
  }

  callChildrenHook (hook) {
    const elements = []
    const domNodes = []

    this.childrenThatAnimated.forEach(childKey => {
      // If this was an exit animation, the child may no longer exist.
      // If so, skip it.
      const child = this.findChildByKey(childKey)
      if (!child) {
        return
      }
      elements.push(child)
      if (this.hasChildData(childKey)) {
        domNodes.push(this.getChildData(childKey).domNode)
      }
    })

    hook(elements, domNodes)
  }

  isAnimationDisabled (props) {
    return props.disableAllAnimations ||
      (props.duration === 0 && props.delay === 0 && props.staggerDurationBy === 0 && props.staggerDelayBy === 0)
  }

  findChildByKey (key) {
    return this.state.children.find(child => child.key === key)
  }

  hasChildData (key) {
    return this.childrenData.hasOwnProperty(key)
  }

  getChildData (key) {
    return this.hasChildData(key) ? this.childrenData[key] : {}
  }

  setChildData (key, data) {
    this.childrenData[key] = Object.assign({}, this.getChildData(key), data)
  }

  removeChildData (key) {
    // remove childrenData[key]
    // but avoid using 'delete' operator
    // TODO: allow destructuring, since v8 supports it directly (but babel complains): const {[key]: removed, ...childrenDataWithoutKey} = this.childrenData
    const childrenDataWithoutKey = { }
    for (const existingKey in this.childrenData) {
      if (existingKey !== key) {
        childrenDataWithoutKey[existingKey] = this.childrenData[existingKey]
      }
    }
    this.childrenData = childrenDataWithoutKey
    this.setState(prevState => Object.assign({}, prevState, {
      children: prevState.children.filter(child => child.key !== key)
    }))
  }

  getChildRefDomNode (child, childRef) {
    if (!childRef) {
      return
    }
    let domNode
    if (childRef instanceof window.HTMLElement) {
      domNode = childRef
    } else {
      const deepNode = findDOMNode(childRef)
      if (deepNode && deepNode.nodeType !== window.Node.TEXT_NODE) {
        domNode = deepNode
      }
    }
    if (child.domNode !== domNode) {
      this.setChildData(child.key, { domNode })
    }
  }

  getParentRefDomNode (parentRef) {
    this.parentData.domNode = parentRef
  }

  render () {
    const {
      typeName: ComponentType
    } = this.props
    // clone child components so that we can define our own ref,
    // but not steal it from the child itself
    const children = this.state.children.map(
      child => cloneElement(child, {
        ref: this.getChildRefDomNode.bind(this, child)
      })
    )
    // pass through all props that aren't ours to the child
    const parentOwnProps = {}
    for (const propKey of Object.keys(this.props)) {
      if (!PROP_KEYS.includes(propKey)) {
        parentOwnProps[propKey] = this.props[propKey]
      }
    }
    // render using the requested html element type
    return <ComponentType
      ref={this.getParentRefDomNode.bind(this)}
      {...parentOwnProps}
      children={children}
    />
  }
};

ListWithTransitions.defaultProps = {
  easing: 'ease-in-out',
  duration: 350,
  delay: 0,
  staggerDurationBy: 0,
  staggerDelayBy: 0,
  typeName: 'div',
  disableAllAnimations: false,
  bottomAligned: false,
  enterAnimation: {},
  leaveAnimation: {}
}
const PROP_KEYS = Object.keys(ListWithTransitions.defaultProps)
module.exports = ListWithTransitions
