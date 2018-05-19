# :tophat: Style guidelines

> How we do inline-styles that work® at :lion: Brave

All applicable styles should be colocated with their corresponding JavaScript component using [Aphrodite](https://github.com/Khan/aphrodite).

## Legacy

All legacy styles are processed with [LESS](http://lesscss.org/) and can be found in the `/less` directory. These should still be maintained but all future CSS should be written in JavaScript and kept inside the appropriate component file.


## Note
This page is regarding how we make use of Aphrodite in our codebase, if you need guidance on how to refactor components, please refer to our [wiki page](https://github.com/brave/browser-laptop/wiki/Refactoring-styles-to-Aphrodite).

Also, note that this style guide was re-made after some code has being refactored. If you see something already _Aphroditized_ that doesn't follow patterns described here, please consider sending a PR :)

## Table of Contents

* [Architecturing styles](#architecturing-styles)
  * [Where to put my code](#where-to-put-my-code)
    * [The global file](#the-global-file)
    * [The commonStyles file](#the-commonstyles-file)
    * [The animations file](#the-animations-file)
  * [Sharing styles across components](#sharing-styles-across-components)
    * [Styles specific for a given component](#styles-specific-for-a-given-component)
  * [Naming styles](#naming-styles)
    * [Naming styles objects](#naming-styles-objects)
    * [How we name styles](#how-we-name-styles)
    * [Defining our blocks, elements, and modifiers](#defining-our-blocks-elements-and-modifiers)
    * [Keep the style name simple](#keep-the-style-name-simple)
    * [Avoid longCamelCasedStyleName](#avoid-longcamelcasedstylename)
  * [Styles are the last thing](#styles-are-the-last-thing)
  * [Important is evil](#important-is-evil)
* [Best practices](#best-practices)
  * [Write a comment](#write-a-comment)
  * [Always add space between styles objects](#always-add-space-between-styles-objects)
  * [Dealing with pseudo-states](#dealing-with-pseudo-states)
  * [Dealing with media-queries](#dealing-with-media-queries)
  * [Dealing with keyframes](#dealing-with-keyframes)
  * [Dealing with vendor prefixes](#dealing-with-vendor-prefixes)
  * [Dealing with numbers](#dealing-with-numbers)
    * [To-quote-or-not-to-quote](#to-quote-or-not-to-quote)
    * [Having to parse integers](#having-to-parse-integers)
  * [Dealing with conditionally applied styles](#dealing-with-conditionally-applied-styles)
* [There will be dragons](#there-will-be-dragons)
  * [Dealing with OS-specific styles](#dealing-with-os-specific-styles)
  * [Descendant selection of pseudo-state](#descendant-selection-of-pseudo-state)
  * [Dealing with `cx({})` and legacy code](#dealing-with-cx-and-legacy-code)
  * [Dealing with `font-awesome`](#dealing-with-font-awesome)
* [Testing styled-components](#testing-styled-components)
* [All set, where do I start?](#all-set-where-do-i-start)

## Architecturing styles

### Where to put my code

The best practice regarding components is to split them into separate files, and that's what you should do with styles as well. Styles should be bound to the component whenever possible. For places where several styles apply (such as tab), that's OK to create a separated file for that. Styles files lives inside `app/renderer/components/styles`.

#### The global file

We have a global file to share common style properties such as colors, spacing, and shadows. If there's a class that is used multiple times across our application, they should live here.

#### The commonStyles file

This file is specific for class-patterns. If there's a class that is used multiple times across our application, they should live here.

#### The animations file
This file is just a POJO (plain old JavaScript object), and that's how Aphrodite deals with keyframes - and where they all should live. Use it if you want to animate something complex. You can see a simple usage of it at [`tabContent.js`](https://github.com/brave/browser-laptop/blob/master/app/renderer/components/tabContent.js), where we make use of `spinKeyframes` for our tab loading animation.

### Sharing styles across components

Shared styles should be pretty straight-forward. To follow a pattern and for better consistency, only share styles with one component:

```js
// This is our style file, awesomeStyle.js
const {StyleSheet} = require('aphrodite/no-important')
const globalStyles = require('./global')

const styles = StyleSheet.create({
  soBlue: {
    color: 'blue'
  }
}

module.exports = styles
```

```jsx
// This is our component

const styles = require('../../app/renderer/components/styles/awesomeStyle.js')

class BlueComponent extends ImmutableComponent {
  render() {
    return <div className={css(styles.soBlue)} />
  }
}
```

#### Styles specific for a given component

Ideally, styles should live together with components. Why? This practice makes it easier to change styles without affecting other components. If there's a pattern for a given property/class, it should live inside `global.js` (properties) or `commonStyles.js` (classes).

### Naming styles

#### Naming styles objects

All names should be written as `styles`, no matter if they live in the same component or in a different file (example below). This makes styles consistent across our app:

```js
const styles = StyleSheet.create({
  something: {
    backgroundColor: 'pink'
  }
})
```

Same applies for exporting/importing:

```js
// export
module.exports = styles

// import
const styles = require('./something')
```

#### How we name styles

* BEM-like pattern
* Always camelCased, avoiding longCamelCasedStyleName
* Never quoted

#### Defining our blocks, elements, and modifiers

We make use of BEM for our styles, being the only difference is that we replace `--` (double dash) with `__` (double underline).

[Robin Rendle](https://css-tricks.com/bem-101/#article-header-id-0) points out these reasons why we should consider BEM:

> 1. If we want to make a new style of a component, we can easily see which modifiers and children already exist. We might even realize we don't need to write any CSS in the first place because there is a pre-existing modifier that does what we need.
> 2. If we are reading the markup instead of CSS, we should be able to quickly get an idea of which element depends on another (in the previous example we can see that .btn__price depends on .btn, even if we don't know what that does just yet.)
> 3. Designers and developers can consistently name components for easier communication between team members. In other words, BEM gives everyone on a project a declarative syntax that they can share so that they're on the same page.

Decision to make use of BEM took the following considerations:

1. Following BEM should avoid visual regressions nicely.
2. It follows a simple set of rules that once learned makes code easier to follow and make changes. Turns out that the naming convention adopted by BEM fits very well with parsed names set by Aphrodite, which makes the code easier to follow even after parsed by Aphrodite.
3. Reduces style conflicts by keeping CSS specificity to a minimum level. Even with Aphrodite, there's a small (but worth considering) chance that some parsed style could conflict with other style with the same name. Naming convention set by BEM can reduce even more the risk.

Below an overview of our practices, given `<BrowserButton>` component:

```js
browserButton: {}, // block -- this is our button
browserButton__icon: {}, // element -- a child element of our button, in this case an icon
browserButton_primary: {} // modifier -- we have a lot of button styles, this one customizes our primary button
browserButton_primary__icon: {} // mixing it all -- our style for an icon inside a primary button
```

See [browserButton.js](https://github.com/brave/browser-laptop/blob/master/app/renderer/components/common/browserButton.js) for a live example.

#### Keep the style name simple

Notice that our styles resemble our code state, which means that if you strictly follow BEM practices, and your style name looks too big for you, you can consider that it is a strong indicator that either you have more elements than it is needed, or that some child elements should be split to a new file with its own styles (i.e. a new component).

**Bad**

```js
styles = StyleSheet.create({
  // Uppercased, quoted :(
  'Component': {
    color: 'green'
  },

  // too big. Very likely that componentChild should be a separated component
  component_someModifer__componentBody__componentChild__componentInnerDiv_componentInnerDivText: {
    color: 'blue'
  }
})
```


**Good**
```js
styles = StyleSheet.create({
  // no quotes, camelCased :)
  styleName: {
    color: 'green'
  },

  // plain and simple ++
  styleName_modifier__caret: {
    color: 'blue'
  }
})
```

Hint: BEM defines relationship between blocks and elements with `__`, so you do not have to include `Wrapper` or `Component` in the name.

**Bad**
```js
component_someModifer__componentBody__componentChild__componentInnerDiv_componentInnerDivText
```

**Good**
```js
component_modifer__body__child__inner_text
```

#### Avoid longCamelCasedStyleName

camelCased style names often suggest that the component can be divided into multiple elements. Avoiding camelCased long names lets you create components which share common styles. It will make it possible to maintain style consistency easily.

**Bad**

```js

<footer className={css(styles.footer)}>
  <button className={css(styles.footer__blueCommonButtonOnFooter)} />
  <button className={css(styles.footer__redCommonButtonOnFooter)} />
</footer>

...

styles = StyleSheet.create({
  footer: {
    display: 'flex'
  },

  footer__blueCommonButtonOnFooter: {
    color: 'blue',
    height: '25px', // dupe
    width: '30px' // dupe
  },

  footer__redCommonButtonOnFooter: {
    color: 'red',
    height: '25px', // dupe
    width: '30px' // dupe
  },
})
```

**Good**

```js

<footer className={css(styles.footer)}>
  <button className={css(styles.footer__commonButton, styles.footer__commonButton_red)} />
  <button className={css(styles.footer__commonButton, styles.footer__commonButton_blue)} />
</footer>

...

styles = StyleSheet.create({
  footer: {
    display: 'flex'
  },

  footer__commonButton: {
    height: '25px', // deduped
    width: '30px' // deduped
  },

  footer__commonButton_red: {
    color: 'red'
  },

  footer__commonButton_blue: {
    color: 'blue'
  },
})
```

It is **always** good to reduce duplicates.

### Styles are the last thing

Inside a component, you should always put styles as the last part of your component. This makes it easier for other contributors to deal with code other than styles and if you're refactoring, it's better to see which component should be changed before seeing which classes it has.

**Good**
```jsx
const styles = require('../../app/renderer/components/styles/awesomeStyle.js')

class Tab extends ImmutableComponent {
  render() {
    return <div className={css(styles.soBlue)} />
  }
}

const styles = StyleSheet.create({
  soBlue: {
    color: 'blue'
  }
}

```

**Bad (this will be rejected)**
```jsx
const styles = require('../../app/renderer/components/styles/awesomeStyle.js')

// Look ma', I'm first!!
const styles = StyleSheet.create({
  soBlue: {
    color: 'blue'
  }
}

class Tab extends ImmutableComponent {
  render() {
    return <div className={css(styles.soBlue)} />
  }
}
```

### Important is evil

By default, importing Aphrodite will make all styles applied as `!important`. However, we can flag against that by using `/no-important`. We should whenever possible prefer that flag:

```js
const {StyleSheet, css} = require('aphrodite/no-important')
```

## Best practices

### Write a comment

With the current test code, you cannot detect visual regressions, which often happen when the thing gets complicated. Therefore it is important to write a comment on the styles you are going to add/modify/remove.

By leaving a comment, it will be much easier for future contributors to understand why the style is defined so, and to modify it when they find a better way, without being anxious about regressions.

When leaving a comment on modified styles, please do not forget to include the number of the issue and/or pull request related with the change, in order to make it possible for other contributors to follow the context.

**Bad**

```js
const styles = StyleSheet.create({
  style1: {
    background: 'purple'
  },

  style1_orange:
    background: 'orange'
  }
})
```

**Good**

```js
const styles = StyleSheet.create({
  style1: {
    background: 'purple'
  },

  // Change the background from purple to orange based on some conditions.
  // Please refer #00000 for the discussion.
  style1_orange:
    background: 'orange'
  }
})
```

### Always add space between styles objects

**Bad:**

```js
const styles = StyleSheet.create({
  style1: {
    background: 'purple'
  },
  style2:
    background: 'orange'
  }
})
```

**Good:**

```js
const styles = StyleSheet.create({
  style1: {
    background: 'purple'
  },

  style2:
    background: 'orange'
  }
})
```

Note that this applies for nested styles as well.

**Also good:**

```js
const styles = StyleSheet.create({
  style1: {
    background: 'purple',

    // I'm nested
    ':hover': {
      bakground: 'green'
    }
  },

  style2:
    background: 'orange'
  }
})
```

### Dealing with pseudo-states

Aphrodite works ok with pseudo-states like `:hover` and `:active`, `:before`, `:after`, as well with `:nth-child()`.

There's no strict rule here, but you should avoid calling numbered children, being the only exception `:nth-child(even)` or `:nth-child(odd)`.

**Bad:**

```js
// if child have different properties, they should have their own class
wrapper: {
  fontSize: '15px',

  ':nth-child(1)': {
    background: 'purple'
  },
  ':nth-child(2)'
    background: 'orange'
  }
}
```

**Good:**

```js
  // we can't control how many items we'll have, but we want them styled differently
wrapper: {
  fontSize: '15px',
  background: 'orange',

  ':nth-child(even)': {
    background: 'purple'
  }
}
```

### Dealing with media-queries

Media queries usually have a long name. To make it reusable and easier to read the breakpoint should be defined under `global.js`, under `breakpoints` object. Media queries can be nested inside a component - and that's how you should use it. Breakpoint should follow `[at]BreakpointOrsizeHere` naming convention. If there will be only one breakpoint, `atBreakpoint` is a readable name:

**Suggestions:**

* `atBreakpoint600`
* `atNarrowView`
* `atLargeView`
* `atBreakpoint`

```js
// global.js

breakpoint: {
  newBreakpoint: '600px'
}
```

```js
// component

// That's big.
const atNarrowView = `@media screen and (max-width: ${globalStyles.breakpoint.breakpointNewPrivateTab})`


const styles = StyleSheet.create({
  myComponent: {
    maxWidth: '700px',

    // Nice and clean ;)
    [atNarrowView]: {
      maxWidth: '380px'
    }
  }
}
```

### Dealing with keyframes

Keyframes have their own file and should live there (`animations.js`). Their names should match `[type_of_animation]Keyframes` convention. Below an example extracted of our loading animation:


```js

const {spinKeyframes} = require('./styles/animations')

...

const styles = StyleSheet.create({
  loadingIcon: {
    backgroundImage: `url(${loadingIconSvg})`,
    animationName: spinKeyframes, // here's our hero.
    animationTimingFunction: 'linear',
    animationDuration: '1200ms',
    animationIterationCount: 'infinite'
  }
}
```

### Dealing with vendor prefixes

Sometimes we'll need to flag `-webkit-` prefix. Prefer camel-case instead of quoted objects (more below):

**Bad**
```js
const privateStyles = StyleSheet.create({
  icon: {
    '-webkit-mask-image': `url(${imageUrl})`
  }
}
```

**Good**
```js
const privateStyles = StyleSheet.create({
  icon: {
    WebkitMaskImage: `url(${imageUrl})`
  }
}
```

By default React will take care of naming coercion so you shouldn't worry about that.

### Dealing with numbers

As a general rule numbers should be hosted inside our `global.js` styles file unless they're too specific (trust your gut here - we trust you ;P). There are some gotchas that you should be aware:

#### To-quote-or-not-to-quote

Before this style was created there wasn't a pattern regarding that, so on our codebase we have both examples. Starting from now, there's no need to quote numbers since they'll be coerced as needed by React/Aphrodite:

**Bad**

```js
styles = StyleSheet.create({
  opacity: '0.5'
})
```

**Good**

```js
styles = StyleSheet.create({
  opacity: 0.5 // Look ma'! no quotes here
})
```

#### Having to parse integers

Sometimes you'll have to get the number of a given property written in pixels. You're encouraged to parse that value instead of creating a new class:

```js
// global.js

const globalStyles = {
  // 1000px is a valid value but not a valid number, ok to quote
  someClass: {
    something: '1000px'
  }
}
```

**Bad**

```js
// other component

someClassINeed: {
  // hard-coded, but we have that value already
  something: 1000
}
```

**Good**

```js
// other component

someClassINeed: {
  // re-used. Will be converted to 1000
  something: Number.parseInt(globalStyles.someClass.something, 10)
}
```

### Dealing with conditionally applied styles

If your style is conditional and has more than one condition, consider putting them in a constant to make it clearer/more readable. Variable names should be declarative rather than imperative:

**Bad**
```jsx
<Component
  className={css(this.navBar && this.braveLogo && styles.braveLogoImage)} />
```

**Good**
```jsx
const navBarBraveLogo = this.navBar && this.braveLogo

<Component
  className={css(navBarBraveLogo && styles.braveLogoImage)} />
```

The overall pattern to apply styles conditionally is:

```jsx
<Component
  className={css(conditional && style.componentStyle)} />
```

or for something a little more complex:

```jsx
<Component
  className={css((conditional || otherConditional) && style.componentStyle)} />
```

## There will be dragons

### Dealing with OS-specific styles

At some point you'll want to apply a style for a given OS. For those cases we make use of our `platformUtil` method:


```jsx
const {isWindows} = require('../../app/common/lib/platformUtil')

<Component className={
  // Only windows will be affected
  css(isWindows() && styles.tabForWindows)
}>
```

### Descendant selection of pseudo-state

Aphrodite don't deal well with that. However, that's a good thing and makes codebase more concise avoiding nested-styles hell.

If that's strictly necessary, please make use of an `action` to dispatch changes you need so your className can be changed. A good example can be found looking at `windowActions.setTabHoverState()`, which we use to check if a tab is being hovered. If so, our closeTab icon is fired.

If you look at how it was done before using Aphrodite:


```less
.closeIcon {
  opacity: 0; // Hide closeIcon by default
}

.tab {
  &:hover {
    .closeIcon {
      opacity: 1; // If mouse is hovering tab, show close icon
    }
  }
}
```

It may be seem as overkill at first, but that's the only way you can manipulate descendants of pseudo-states with Aphrodite. If you have any questions regarding that please fill an issue and we'll happily assist.

### Dealing with `cx({})` and legacy code

Before making use of Aphrodite, we relied on className (`cx()`) module to conditionally apply styles:

```jsx
<div
  className={cx({
    mainClass: true, // mainClass will always be shown
    // Below will be applied only if condition match
    conditionalClass: this.canBeApplied && this.isValid})} />
```

At some point you can deal with classes using with `cx()` that can't be changed (maybe you're dealing with a child-component). For those cases, add another property to make use of Aphrodite, and leave it as-is until you can refactor the full component:


```jsx
<div
  className={cx({
    mainClass: true, // mainClass will always be shown
    // Below will be applied only if condition match
    conditionalClass: this.canBeApplied && this.isValid,
    [css(styles.awesomeAphroditeStyleHere]: true
})} />
```


### Dealing with `font-awesome`

Font awesome is a set of icons that we use across our app. Most of it is already replaced, but not all.

If you have to include another icon, please put it under `global.js` file. This way we can check which icons we are really using, so we can replace as needed.

```js
// under global.js
  appIcons: {
    clipboard: 'fa fa-clipboard',
    someIconYouNeed: 'fa fa-something'
  }
```

The main gotcha of font-awesome is that it can't be included together with Aphrodite, consider the following case:

```jsx
// I have a span with font-awesome that I want to change colors

// no-op.
<span className={css(globalStyles.appIcons.clipboard, styles.makeItGreen)} />
```

That's because Aphrodite concatenate all strings after compiling, making `fa-` class useless.

Once we have our own set of icons we can remove that, but for now you'll need to apply another element to have your icon:


```jsx
// I have a span with font-awesome that I want to change colors

// works
<span className={css(styles.makeItGreen)}>
  <span className={globalStyles.appIcons.clipboard} />
</span>
```

## Testing styled-components

As styles are converted from LESS to Aphrodite, we will lose the ability to control the generated class names. This means for our webdriver tests will no longer be able to use class names as selectors. Instead we will be adding the attribute `data-test-id` to elements. This approach gives us the added benefit of differentiating between code meant for presentation and code meant for testing.

An example would be moving:

```jsx
<Button className='paymentHistoryButton' l10nId={buttonText} onClick={onButtonClick.bind(this)} />
```

to:

```jsx
<Button className={css(paymentButton)} data-test-id='paymentHistoryButton' l10nId={buttonText} onClick={onButtonClick.bind(this)} />
```

## All set, where do I start?

Please refer to our tag [`Refactoring/Aphrodite`](https://github.com/brave/browser-laptop/issues?q=is%3Aopen+is%3Aissue+label%3Arefactoring%2Faphrodite) for open issues. If you want to track what we are doing regarding it, please refer to our [Styles Refactor Task-Force](https://github.com/brave/browser-laptop/projects/7).
