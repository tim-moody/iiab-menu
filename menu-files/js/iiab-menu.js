// iiab-menu.js
// copyright 2017 Tim Moody

// debug

if(typeof debug == 'undefined') {
	debug = false;
}

if(typeof forceFullDisplay == 'undefined') { // allow override in index.html
	forceFullDisplay = false;
}

// Ports used by services - not currently tied to xsce ansible
var menuConfig = {};
//menuConfig['kiwixPort'] = "3000";
//menuConfig['kalitePort'] = "8008";
//menuConfig['calibrePort'] = "8010";

// constants
var zimVersionIdx = "/common/assets/zim_version_idx.json";
var htmlBaseUrl = "/modules/";
var webrootBaseUrl = "/";
var apkBaseUrl = "/content/apk/";
var menuUrl = '/iiab-menu/menu-files/';
var configJson = '/iiab-menu/config.json';
var defUrl = menuUrl + 'menu-defs/';
var imageUrl = menuUrl + 'images/';
var menuServicesUrl =  menuUrl + 'services/';

var host = 'http://' + window.location.hostname;
var isMobile = detectMob();
var showFullDisplay = true; // show full display if not mobile device or if force Full Display
if (isMobile && !forceFullDisplay)
  showFullDisplay = false;
var baseFontSize = 16; // for non-mobile in px
var mobilePortraitSize = baseFontSize + "px";
var mobileLscapeSize = baseFontSize / 2  + "px";
var menuHtml = "";
var menuDefs = {};
var zimVersions = {};

var scaffold = $.Deferred();
var ajaxCallCount = 0;
var i;

// get config
var getConfigJson = $.getJSON(configJson)
.done(function( data ) {
	consoleLog(data);
  menuConfig = data;
  apkBaseUrl = menuConfig['apkBaseUrl'];
  if (isMobile){
    baseFontSize = menuConfig['mobilePortraitSize'].split("px")[0];
    mobilePortraitSize = baseFontSize + "px";
    mobileLscapeSize = baseFontSize / 2 + "px";
    window.addEventListener("resize", resizeHandler);
  }
  })
.fail(jsonErrhandler);

// get name to instance index for zim files
var getZimVersions = $.getJSON(zimVersionIdx)
.done(function( data ) {
	//consoleLog(data);
zimVersions = data;})
.fail(jsonErrhandler);

$.when(scaffold, getZimVersions, getConfigJson).then(procMenu);

// create scaffolding for menu items
var html = "";
for (i = 0; i < menuItems.length; i++) {
	var menu_item_name = menuItems[i];
	menuDefs[menu_item_name] = {}
	menuItemDivId = i.toString() + "-" + menu_item_name;
	menuDefs[menu_item_name]['menu_id'] = menuItemDivId;

	html += '<div id="' + menuItemDivId + '" class="content-item" dir="auto">&emsp;Attempting to load ' + menu_item_name + ' </div>';
}
$("#content").html(html);
$(".toggleExtraHtml").toggle(showFullDisplay);
scaffold.resolve();

// click function for full display toggle
$( "#toggleFullDisplay" ).click(function() {
  $(".toggleExtraHtml").toggle();
});

function procMenu() {
	resizeHandler (); // if a mobile device set font-size for portrait or landscape
	for (var i = 0; i < menuItems.length; i++) {
		consoleLog(menuItems[i]);
		getMenuDef(menuItems[i])
	}
}

function getMenuDef(menuItem) {
	var module;
	var menuId = menuDefs[menuItem]['menu_id']; // save this value
	ajaxCallCount += 1;

	var resp = $.ajax({
		type: 'GET',
		async: true,
		url: defUrl + menuItem + '.json',
		dataType: 'json'
	})
	.done(function( data ) {
		menuDefs[menuItem] = data;
		menuDefs[menuItem]['menu_item_name'] = menuItem;
		menuDefs[menuItem]['add_html'] = "";
		menuDefs[menuItem]['menu_id'] = menuId;
		module = menuDefs[menuItem];
		procMenuItem(module);
		checkMenuDone();
	})
	.fail(function (jqXHR, textStatus, errorThrown){
		var menuHtml = '<div class="content-item" style="padding:10px; color: red; font-size: 1.5em">' + menuItem + ' - file not found or improperly formatted</div>';
		$("#" + menuId).html(menuHtml);
		checkMenuDone();
		jsonErrhandler (jqXHR, textStatus, errorThrown); // probably a json error
	});
	return resp;
}

function procMenuItem(module) {
	var menuHtml = "";
	var langClass = "";

	var menuItemDivId = "#" + module['menu_id'];
	consoleLog(module);
	if (module['intended_use'] == "zim")
	menuHtml += calcZimLink(module);
	else if (module['intended_use'] == "html")
		menuHtml += calcHtmlLink(module);
  else if (module['intended_use'] == "webroot")
	  menuHtml += calcWebrootLink(module);
	else if (module['intended_use'] == "kalite")
		menuHtml += calcKaliteLink(module);
  else if (module['intended_use'] == "calibre")
		menuHtml += calcCalibreLink(module);
	else if (module['intended_use'] == "osm")
		menuHtml += calcOsmLink(module);
	else if (module['intended_use'] == "info")
		menuHtml += calcInfoLink(module);
	else
  	menuHtml += '<div class="content-item" style="padding:10px; color: red; font-size: 1.5em">' +  module['menu_item_name'] + ' - unknown module type</div>';

	langClass = 'lang_' + module.lang;
	$(menuItemDivId).addClass(langClass);
	$(menuItemDivId).html(menuHtml);
	getExtraHtml(module);
}

function calcZimLink(module){
	var href = host + ':' + menuConfig.kiwixPort + '/' + zimVersions[module.zim_name] + '/';

	var html = calcLink(href,module);
	return html
}

function calcHtmlLink(module){
	var href = htmlBaseUrl + module.moddir;

	var html = calcLink(href,module);
	return html
}

function calcWebrootLink(module){
	var href = webrootBaseUrl + module.moddir;

	var html = calcLink(href,module);
	return html
}

function calcKaliteLink(module){
	var portRef = module.lang + '-kalitePort';
	var href = host + ':'
	if (menuConfig.hasOwnProperty(portRef))
		href += menuConfig[portRef];
	else
		href += menuConfig['en-kalitePort'];

	var html = calcLink(href,module);
	return html
}

function calcCalibreLink(module){
	var href = host + ':' + menuConfig.kalitePort;

	var html = calcLink(href,module);
	return html
}

function calcCalibreLink(module){
	var href = host + ':' + menuConfig.calibrePort;

	var html = calcLink(href,module);
	return html
}

function calcOsmLink(module){
	var href = '/iiab/static/map.html';

	var html = calcLink(href,module);
	return html
}

function calcInfoLink(module){
	var href = null;

	var html = calcLink(href,module);
	return html
}

function calcLink(href,module){
	var startPage = href;

	// record href for extra html
	menuDefs[module.menu_item_name]['href'] = href;

	if (module.hasOwnProperty("start_url"))
	startPage = href + '/' + module['start_url'];

	var html = '<div style="display: table;"><div style="display: table-row;">';
	html+='<div class="content-icon">';
	if (href != null)
	  html+='<a href="' + startPage + '"><img src="' + imageUrl + module.logo_url + '" alt="' + module.title + '"></div>';
	else
		html+='<img src="' + imageUrl + module.logo_url + '" alt="' + module.title + '"></div>';
	html+='<div class="content-cell"><h2>';
	if (href != null)
	  html+='<a href="' + startPage + '">' + module.title + '</a>';
	else
		html+=module.title;
	html+='</h2><p>' + module.description + '</p>';
	if (module.hasOwnProperty("apk_file"))
	html+='<p>Click here to download <a href="' + apkBaseUrl + module.apk_file + '">' + module.apk_file + '</a></p>';
	consoleLog('href = ' + href);
	html += '<div id="' + module.menu_id + '-htmlf" class="toggleExtraHtml"></div>'; // scaffold for extra html
	html+='</div></div></div>';

	return html
}

function detectMob() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
}

function resizeHandler (){
	if (isMobile){
  	if (screen.height > screen.width)
  	  $(":root").css("font-size", mobilePortraitSize);
    else
      $(":root").css("font-size", mobileLscapeSize);
  }
}

function getExtraHtml(module) {
	if (module.hasOwnProperty("extra_html") && (module['extra_html'] != "")){
		consoleLog('starting get extra');
		consoleLog(module.extra_html);
		ajaxCallCount += 1;
		var resp = $.ajax({
			type: 'GET',
			async: true,
			url: defUrl + module.extra_html,
			dataType: 'html'
		})
		.done(function( data ) {
			//menuDefs[module.menu_item_name]['add_html'] = data;
			consoleLog('in get extra done');
			var add_html = data;
			var re = new RegExp('##HREF-BASE##', 'g');
			add_html = add_html.replace(re, module.href);
			menuItemHtmlfDivId = "#" + module.menu_id + '-htmlf';
			consoleLog(menuItemHtmlfDivId);
			$(".toggleExtraHtml").toggle(showFullDisplay);
			$(menuItemHtmlfDivId).html(add_html);
			checkMenuDone();
		})
		.fail(checkMenuDone);
		return resp;
	}
}

function checkMenuDone(){
	ajaxCallCount -= 1;
	consoleLog (ajaxCallCount);
	if (ajaxCallCount == 0){
		$('a').click(trackUsage);
		//alert ("menu done");
	}
}

function trackUsage(event){
	event.preventDefault();
	//alert("in track usage");
	var url = $(this).attr('href');
	consoleLog (url);
	$.ajax({
		method: "GET",
		async: true,
		url: menuServicesUrl + "track_usage.php",
		dataType: 'html',
		data: { link_clicked: url }
	})
	.always(function( data ) {
		window.location = url;
	});
}

$('#btn-rating-input').on('click', function() {
	$('#rating-input').rating('refresh', {
		showClear:true,
		disabled: !$('#rating-input').attr('disabled')
	});
});

$('#btn-feedback').click(function(){
	$('#feedbackModal').modal('show');
});

$('#btn-submitFeedback').click(function(){
	if (validateFeedback())
	sendFeedback();
});

// clear feedback message and enable button for showing modal
$('#feedbackModal').on('show.bs.modal', function () {
	$('#feedbackMessageModal').html("");
	$("#btn-submitFeedback").prop("disabled",false);

});

// we need something in comments and a name would be nice
function validateFeedback (){
	if ($("#comments-text").val() == ""){
		$('#feedbackMessageModal').html("Please give us some feedback.");
		return false;
	}
	if ($("#feedback-name").val() == ""){
		$('#feedbackMessageModal').html("Please tell us your name.");
		return false;
	}
	return true;
}

function sendFeedback(){
	$("#btn-submitFeedback").prop("disabled",true);
	var resp = $.ajax({
		url: menuServicesUrl + 'record_feedback.php',
		type: 'post',
		dataType: 'json',
	data: $('form#feedbackForm').serialize()})
	.success (function(data) {
		console.log(data);
		if (data == "SUCCESS"){
			//alert ("Thanks for submitting your feedback");
			$('#feedbackMessageModal').html("Thanks for submitting your feedback");
			setTimeout(function() {$('#feedbackModal').modal('hide');}, 3000);
		}
		else{
			$('#feedbackMessageModal').html(data);
			//alert (data);
		}
	})
	.fail (function(dataResp, textStatus, jqXHR) {
		console.log(jqXHR);
		$('#feedbackMessageModal').html(dataResp);
	});
	return resp;
}
function jsonErrhandler (jqXHR, textStatus, errorThrown)
{
	// only handle json parse errors here, others in ajaxErrHandler
	//  if (textStatus == "parserror") {
	//    //alert ("Json Errhandler: " + textStatus + ", " + errorThrown);
	//    displayServerCommandStatus("Json Errhandler: " + textStatus + ", " + errorThrown);
	//  }
	consoleLog("In Error Handler logging jqXHR");
	consoleLog(textStatus);
	consoleLog(errorThrown);
	consoleLog(jqXHR);

	return false;
}

function consoleLog (msg)
{
	if (debug == true)
	console.log(msg); // for IE there can be no console messages unless in tools mode
}
