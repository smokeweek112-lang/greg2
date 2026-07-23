// Global state to track if loading screen has been shown
let hasShownLoadingScreen = false

export const getHasShownLoadingScreen = () => hasShownLoadingScreen

export const setHasShownLoadingScreen = (value: boolean) => {
  hasShownLoadingScreen = value
}
