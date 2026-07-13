export function detectIOSBrowser(userAgent='',isIOS=false){
  if(!isIOS)return'not-ios'
  if(/CriOS/i.test(userAgent))return'chrome'
  if(/FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|YaBrowser|Brave/i.test(userAgent))return'other'
  if(/Safari/i.test(userAgent))return'safari'
  return'other'
}
