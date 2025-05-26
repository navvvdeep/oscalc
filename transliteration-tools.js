function bookmark(url,description){
	var bookmark_url= url; 
	var text_description=description; 
	if (navigator.appName=="Microsoft Internet Explorer" && parseInt(navigator.appVersion) >= 4 && navigator.platform.indexOf("Win") > -1 && navigator.appVersion.indexOf("SlimBrowser") < 0){ 
		window.external.AddFavorite(bookmark_url,text_description); 
	}
	else{ 
		alert("Press Ctrl+D keys to bookmark this page.\n\nMac users: Press Command (Apple) and \"D\" keys."); 
	}
}

function replacements(search,replacement){
str = str.replace(new RegExp(search, 'g'), replacement);
targetEl.value = str;
}

function convertNumbers(lang){
var e = document.getElementById("transl2");
var txt = e.value;
var roman_numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

if(lang == "gu"){
	var gu_numbers = ["૦", "૧", "૨", "૩", "૪", "૫", "૬", "૭", "૮", "૯"];
	for(i = 0; i < roman_numbers.length; i++){txt = txt.replace(new RegExp(roman_numbers[i], 'g'), gu_numbers[i]);}
	e.value = txt;
	return;
}

if(lang == "hi" || lang == "sa"){
	var hi_numbers = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
	for(i = 0; i < roman_numbers.length; i++){txt = txt.replace(new RegExp(roman_numbers[i], 'g'), hi_numbers[i]);}
	e.value = txt;
	return;
}

if(lang == "pa"){
	var pa_numbers = ["੦", "੧", "੨", "੩", "੪", "੫", "੬", "੭", "੮", "੯"];
	for(i = 0; i < roman_numbers.length; i++){txt = txt.replace(new RegExp(roman_numbers[i], 'g'), pa_numbers[i]);}
	e.value = txt;
	return;
}

if(lang == "bn"){
	var bn_numbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
	for(i = 0; i <= roman_numbers.length; i++){txt = txt.replace(new RegExp(roman_numbers[i], 'g'), bn_numbers[i]);}
	e.value = txt;
	return;
}

}