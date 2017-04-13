// iiab-menu.js
// copyright 2016 Tim Moody

// debug

if(typeof debug == 'undefined') {
	debug = false;
}

// constants
var zimVersionIdx = "/common/assets/zim_version_idx.json";
var htmlBaseUrl = "/modules/";
var webrootBaseUrl = "/";
var apkBaseUrl = "/content/apk/";
var menuUrl = '/iiab-menu/menu-files/';
var defUrl = menuUrl + 'menu-defs/';
var imageUrl = menuUrl + 'images/';
var menuServicesUrl =  menuUrl + 'services/';

var host = 'http://' + window.location.hostname;
var menuHtml = "";
var menuDefs = {};
var zimVersions = {};

var scaffold = $.Deferred();
var ajaxCallCount = 0;
var i;

// get name to instance index for zim files
var getZimVersions = $.getJSON(zimVersionIdx)
.done(function( data ) {
	//consoleLog(data);
zimVersions = data;})
.fail(jsonErrhandler);

$.when(scaffold, getZimVersions).then(procMenu);

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
scaffold.resolve();

function procMenu() {
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
	var href = host + ':3000/' + zimVersions[module.zim_name] + '/';

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
	var href = host + ':8008';

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
	html += '<div id="' + module.menu_id + '-htmlf"></div>'; // scaffold for extra html
	html+='</div></div></div>';

	return html
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
