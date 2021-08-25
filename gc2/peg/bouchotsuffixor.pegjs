{
  let oldBouchotSuffix = options.oldBouchot ? `@${options.oldBouchot}` : "";
  let newBouchotSuffix = options.newBouchot ? `@${options.newBouchot}` : "";
  function suffixBouchot(b) {
    if(!b) {
    	return oldBouchotSuffix;
    }
    if(b === newBouchotSuffix) {
    	return "";
    }
    return b;
  }
}

post
 = items:postItem*
  {
 	return items.join("");
  }

postItem
 = url
 / totoz
 / norloge
 / .

url
 = $((("http" "s"?) / "ftp") "://" ([^< \t\r\n\"])+)

norloge
 = fullNorloge / longNorloge / normalNorloge / shortNorloge

fullNorloge
 = y: norlogeYear "-" m: norlogeMonth "-" d:norlogeDay sep:[T# ] h:norlogeHours ":" mi:norlogeMinutes ":" s:norlogeSeconds b:bouchot?
 {
 return `${y}-${m}-${d}${sep}${h}:${mi}:${s}${suffixBouchot(b)}`;
 }

 longNorloge
 = m: norlogeMonth "/" d:norlogeDay "#" h:norlogeHours ":" mi:norlogeMinutes ":" s:norlogeSeconds b:bouchot?
 {
 return `${m}/${d}#${h}:${mi}:${s}${suffixBouchot(b)}`;
 }
 
norlogeYear
 = [0-9] [0-9] [0-9] [0-9]
 { return text(); }
 
norlogeMonth
 = [0-1] [0-9]
 { return text(); }

norlogeDay
 = [0-3] [0-9]
 { return text(); }

normalNorloge
 = h:norlogeHours ":" mi:norlogeMinutes ":" s:norlogeSeconds b:bouchot?
 {
   return `${h}:${mi}:${s}${suffixBouchot(b)}`;
 }
 
shortNorloge
 = h:norlogeHours ":" mi:norlogeMinutes b:bouchot?
 {
   return `${h}:${mi}${suffixBouchot(b)}`;

 }

norlogeHours
 = [0-2] [0-9]
 { return text(); }
 
norlogeMinutes
 = [0-5] [0-9]
 { return text(); }
 
norlogeSeconds
 = [0-5] [0-9]
 { return text(); }

bouchot
 = $("@" [a-z]+)

totoz
  = $("[:" $[^\]]+ "]")

whitespaces
 = [ \t\r\n]