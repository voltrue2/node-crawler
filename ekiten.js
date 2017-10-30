'use strict';

/**
* Usage:
* node ekiten [*log path]
*/


const request = require('request');
const iconv = require('iconv-lite');
const fs = require('fs');
const crawler = require('./');

const host = 'http://www.ekiten.jp';
const startUrl = 'http://www.ekiten.jp/gen_lesson/';
const limit = 1;
const rate = 250;
const encoding = 'EUC-JP';
const logpath = process.argv[2] || null;

// we need pages with these genres ONLY...
const IGNORE_FILE = __dirname + '/ignores.csv';
const FILE = __dirname + '/results.csv';
const LABELS = '"URL","名称","ジャンル","カテゴリー","電話番号","住所/都道府県","住所/市町村","住所","ウェブサイト","クレジットカード"\n';
const TARGET_TAG = 'class="shop_head"';
const CC = '使用可';
const CATEGORIES = [
	'英会話教室',
	'パソコン教室',
	'料理教室',
	'音楽教室',
	'ダンススクール',
	'自動車教習所',
	'フラワーアレンジメント教室・生け花スクール',
	'書道・習字',
	'専門学校・専修学校',
	'趣味・スクールその他'
];
const duplicates = [];

/*
// add to ignore
try {
	var irows = fs.readFileSync(IGNORE_FILE, 'utf8').split('\n');
	for (var j = 0, jen = irows.length; j < jen; j++) {
		var icol = irows[j].substring(1, irows[j].length - 2);
		crawler.addIgnore(icol);
	}
} catch (err) {
	// we don't have it
}
*/

// skip the pages that we have already collected
try {
	var rows = fs.readFileSync(FILE, 'utf8').split('\n');
	for (var i = 0, len = rows.length; i < len; i++) {
		var cols = rows[i].split(',');
		var path = cols[0].replace(/"/g, '').replace(host, '');
		crawler.addIgnore(path);
	} 
} catch (err) {
	// there's no result file
	// start with creating the result file first with the label columns
	fs.appendFileSync(FILE, LABELS);
}

crawler.addIgnore('lunch_box/');
crawler.addIgnore('restaurant/');
crawler.addIgnore('keyexchange/');
crawler.addIgnore('/edit.php');
crawler.addIgnore('/tel/');
crawler.addIgnore('/review');
crawler.addIgnore('?feature');
crawler.addIgnore('?menu=');
crawler.addIgnore('/mypage');
crawler.addIgnore('/map');
crawler.addIgnore('/history');
crawler.addIgnore('/user_');
crawler.addIgnore('/photo');
crawler.addIgnore('/documents');
crawler.addIgnore('.xml');
crawler.addIgnore('/charge');
crawler.addIgnore('/check');
crawler.addIgnore('/gen_relax');
crawler.addIgnore('/gen_salon');
crawler.addIgnore('/gen_clinic');
crawler.addIgnore('/gen_dental');
crawler.addIgnore('/gen_gourmet');
crawler.addIgnore('/gen_shopping');
crawler.addIgnore('/gen_leisure');
crawler.addIgnore('/gen_life');
crawler.addIgnore('/gen_recycle');
crawler.addIgnore('/gen_house');
crawler.addIgnore('/gen_ceremoney');
crawler.addIgnore('/gen_pet');
crawler.addIgnore('massage/');
crawler.addIgnore('seitai/');
crawler.addIgnore('sekkotsu_seikotsu/');
crawler.addIgnore('shinkyu/');
crawler.addIgnore('chiropractic/');
crawler.addIgnore('esthetics_salon/');
crawler.addIgnore('hair_salon/');
crawler.addIgnore('barber/');
crawler.addIgnore('nail_salon/');
crawler.addIgnore('dentist/');
crawler.addIgnore('pediatrics/');
crawler.addIgnore('orthodontics/');
crawler.addIgnore('otolaryngology/');
crawler.addIgnore('ophthalmology/');
crawler.addIgnore('homecare/');
crawler.addIgnore('dayservice/');
crawler.addIgnore('recycling/');
crawler.addIgnore('ticket/');
crawler.addIgnore('pethotel/');
crawler.addIgnore('animal_hospital/');
crawler.addIgnore('pet/');
crawler.addIgnore('photo_studio/');
crawler.addIgnore('internal_medicine/');
crawler.addIgnore('health_beauty_other/');
crawler.addIgnore('health_beauty_other/');
crawler.addIgnore('dermatology/');
crawler.addIgnore('surgery/');
crawler.addIgnore('psychosomatic_medicine/');
crawler.addIgnore('psychiatry/');
crawler.addIgnore('cosmetic_surgery/');
crawler.addIgnore('obstetrics_gynecology/');
crawler.addIgnore('car/');
crawler.addIgnore('orthopedics/');
crawler.addIgnore('book_usedshop/');
crawler.addIgnore('old_clothes/');
crawler.addIgnore('dvd_usedshop/');
crawler.addIgnore('pawnshop/');
crawler.addIgnore('box_lunch/');
crawler.addIgnore('delivery/');
crawler.addIgnore('house_cleaning/');
crawler.addIgnore('liquor_store/');
crawler.addIgnore('cleaning/');
crawler.addIgnore('babysitter/');
crawler.addIgnore('housekeeping/');
crawler.addIgnore('trimmingsalon/');
crawler.addIgnore('estate_agency/');
crawler.addIgnore('house_reform/');
crawler.addIgnore('leased_immovables/');
crawler.addIgnore('matrimonial_agency/');
crawler.addIgnore('wedding_hall/');
crawler.addIgnore('eventhall/');
crawler.addIgnore('funeral/');
crawler.addIgnore('restaurant/');
crawler.addIgnore('grogshop/');
crawler.addIgnore('sweets/');
crawler.addIgnore('cafe/');
crawler.addIgnore('roast_meat/');
crawler.addIgnore('japanese_food/');
crawler.addIgnore('bar/');
crawler.addIgnore('ramen/');
crawler.addIgnore('hotel/');
crawler.addIgnore('travel_agent/');
crawler.addIgnore('fitness/');
crawler.addIgnore('rental_car/');
crawler.addIgnore('shoes/');
crawler.addIgnore('bag/');
crawler.addIgnore('accessory/');
crawler.addIgnore('fashion/');
crawler.addIgnore('supermarket_food/');
crawler.addIgnore('vocational_school/');
crawler.addIgnore('bookstore/');
crawler.addIgnore('department/');
crawler.addIgnore('consumer_electronic/');
crawler.addIgnore('prep_school/');
crawler.addIgnore('cram_school/');
crawler.addIgnore('private_teacher/');
crawler.addIgnore('/prep_school/');
crawler.addIgnore('/cram_school/');
crawler.addIgnore('/private_teacher/');
crawler.addIgnore('medical_checkup/');
crawler.addIgnore('drugstore/');
crawler.addIgnore('medical_other/');
crawler.addIgnore('nursery/');
crawler.addIgnore('acting_service/');
crawler.addIgnore('electronics_repair/');
crawler.addIgnore('water_leak/');
crawler.addIgnore('equipment_repair/');
crawler.addIgnore('room_repair/');
crawler.addIgnore('keyexchange/');
crawler.addIgnore('extermination/');
crawler.addIgnore('gardener/');
crawler.addIgnore('delivery_service/');
crawler.addIgnore('trunk_room/');
crawler.addIgnore('library/');
crawler.addIgnore('bank/');
crawler.addIgnore('living_other/');
crawler.addIgnore('japanese_restaurant/');
crawler.addIgnore('sushi/');
crawler.addIgnore('eel/');
crawler.addIgnore('tempura/');
crawler.addIgnore('pork_cutlet/');
crawler.addIgnore('kushiage/');
crawler.addIgnore('sukiyaki/');
crawler.addIgnore('syabusyabu/');
crawler.addIgnore('yakitori/');
crawler.addIgnore('soba/');
crawler.addIgnore('udon/');
crawler.addIgnore('okonomiyaki/');
crawler.addIgnore('monjayaki/');
crawler.addIgnore('motsunabe/');
crawler.addIgnore('chinese_restaurant/');
crawler.addIgnore('dumpling/');
crawler.addIgnore('korean_restaurant/');
crawler.addIgnore('european_food/');
crawler.addIgnore('steak/');
crawler.addIgnore('hamburg/');
crawler.addIgnore('curry/');
crawler.addIgnore('french_restaurant/');
crawler.addIgnore('italian_restaurant/');
crawler.addIgnore('pasta/');
crawler.addIgnore('pizza/');
crawler.addIgnore('fastfood/');
crawler.addIgnore('hamburger/');
crawler.addIgnore('family_restaurant/');
crawler.addIgnore('messroom/');
crawler.addIgnore('bread/');
crawler.addIgnore('cake/');
crawler.addIgnore('gourmet_other/');
crawler.addIgnore('taxi/');
crawler.addIgnore('bus/');
crawler.addIgnore('amusement_park/');
crawler.addIgnore('zoo/');
crawler.addIgnore('aquarium/');
crawler.addIgnore('botanical_garden/');
crawler.addIgnore('museum/');
crawler.addIgnore('park/');
crawler.addIgnore('camp_site/');
crawler.addIgnore('pool/');
crawler.addIgnore('roadside_station/');
crawler.addIgnore('cinema/');
crawler.addIgnore('theater/');
crawler.addIgnore('game_center/');
crawler.addIgnore('bowling/');
crawler.addIgnore('karaoke/');
crawler.addIgnore('manga_cafe/');
crawler.addIgnore('net_cafe/');
crawler.addIgnore('sports_facility/');
crawler.addIgnore('golf/');
crawler.addIgnore('public_bath/');
crawler.addIgnore('sauna/');
crawler.addIgnore('play_other/');
crawler.addIgnore('convenience/');
crawler.addIgnore('100yen_shop/');
crawler.addIgnore('home_center/');
crawler.addIgnore('personal_computer/');
crawler.addIgnore('camera/');
crawler.addIgnore('cellular/');
crawler.addIgnore('watch/');
crawler.addIgnore('glasses/');
crawler.addIgnore('contact_glasses/');
crawler.addIgnore('cosmetics/');
crawler.addIgnore('furniture/');
crawler.addIgnore('interior/');
crawler.addIgnore('general_store/');
crawler.addIgnore('stationery/');
crawler.addIgnore('seal/');
crawler.addIgnore('dvd_rental/');
crawler.addIgnore('dvd_sales/');
crawler.addIgnore('musical_instrument/');
crawler.addIgnore('toy/');
crawler.addIgnore('sports_shop/');
crawler.addIgnore('bicycle/');
crawler.addIgnore('bike/');
crawler.addIgnore('shopping_other/');
crawler.addIgnore('infantclassroom/');
crawler.addIgnore('/infantclassroom/');
crawler.addIgnore('/eventhall/');
crawler.addIgnore('/wedding_hall/');
crawler.addIgnore('/matrimonial_agency/');
crawler.addIgnore('/funeral/');
crawler.addIgnore('/menu/');
crawler.addIgnore('/menu_');
crawler.addIgnore('/blogparts_img');
crawler.addIgnore('/ranking/');
crawler.addIgnore('/flyer/');
crawler.addIgnore('/staff/');
crawler.addIgnore('/seitai/');
crawler.addIgnore('/chiropractic/');
crawler.addIgnore('/massage/');
crawler.addIgnore('/sekkotsu_seikotsu/');
crawler.addIgnore('/shinkyu/');
crawler.addIgnore('/esthetics_salon/');
crawler.addIgnore('/health_beauty_other/');
crawler.addIgnore('/catalog/');
crawler.addIgnore('/info/');
crawler.addIgnore('/print/');
crawler.addIgnore('/ticket/');
crawler.addIgnore('/car/');
crawler.addIgnore('/old_clothes/');
crawler.addIgnore('/book_usedshop/');
crawler.addIgnore('flower/');
crawler.addIgnore('box_lunch/');
crawler.addIgnore('delivery/');
crawler.addIgnore('house_cleaning/');
crawler.addIgnore('cleaning/');
crawler.addIgnore('liquor_store/');
crawler.addIgnore('housekeeping/');
crawler.addIgnore('babysitter/');
crawler.addIgnore('nursery/');
crawler.addIgnore('acting_service/');
crawler.addIgnore('gardener/');
crawler.addIgnore('delivery_service/');
crawler.addIgnore('trunk_room/');
crawler.addIgnore('library/');
crawler.addIgnore('bank/');
crawler.addIgnore('living_other/');

crawler.onData(function (url, body, loader, next) {
	var useful = false;
	// we need to determine if we want this page or not first
	for (var i = 0, len = CATEGORIES.length; i < len; i++) {
		if (body.indexOf(CATEGORIES[i]) !== -1) {
			useful = true;
			break;
		}
	}
	// we do not need this page
	if (!useful) {
		// add this to ignore
		fs.appendFileSync(IGNORE_FILE, '"' + url + '"\n');
		crawler.addIgnore(url);
		// move on
		next();
		// discard
		return false;
	}
	// we determine if the page is a list or a target page
	if (body.indexOf(TARGET_TAG) === -1) {
		// move on
		next();
		// this is a list page: no need to parse the page
		return true;
	}
	// check for duplicate
	var id = url.substring(url.indexOf('shop_') + 5);
	id = id.substring(0, id.indexOf('/'));
	if (duplicates.indexOf(id) !== -1) {
		// it is a duplicate
		next();
		return false;
	}
	duplicates.push(id);
	// this is a target page: parse the page now
	var $ = loader(body);
	var leftBlock = loader($('div.left_block').html());
	var name = leftBlock('span[itemprop="name"]').text();
	var genres = leftBlock('div.shop_genre').text();
	var categories = getCategories(leftBlock('div.cat_list').text());

	// missing categories mean that we do not want this page...	
	if (!categories) {
		// add this to ignore
		crawler.addIgnore(url);
		// move on
		next();
		// discard
		return false;
	}

	var prefecture = leftBlock('span[itemprop="addressRegion"]').text();
	var ward = leftBlock('span[itemprop="addressLocality"]').text();
	var street = leftBlock('span[itemprop="streetAddress"]').text();
	var creditCard = $('ul.shop_info_list').text().indexOf(CC) !== -1 ? '使用可' : '使用不可';
	var list = $('div.tri').text().replace(/(\t|\n)/g, '').split('http');
	var links = [];
	for (var i = 0, len = list.length; i < len; i++) {
		if (list[i].indexOf('://') === -1) {
			continue;
		}
		links.push('http' + list[i]);
	}
	// get phone number from another page...
	var phoneLink = $('a.aa-tel--call').attr('href');

	getPhoneNumber(phoneLink, loader, function (error, phone) {
		duplicates.push(phone);
		// write to the file
		var row = '"' + crawler.getHost() + url + '","' +
			name + '","' +
			genres + '","' +
			categories + '","' +
			phone + '","' +
			prefecture + '","' +
			ward + '","' +
			street + '","' +
			links.join(' ') + '","' +
			creditCard + '"\n';
		
		fs.appendFileSync(FILE, row);
	
		// move on
		next();
	});
	// return if we want this page or not
	return true;
});

crawler.start(startUrl, limit, rate, encoding, logpath);

function getCategories(text) {
	var list = [];
	for (var i = 0, len = CATEGORIES.length; i < len; i++) {
		if (text.indexOf(CATEGORIES[i]) !== -1) {
			list.push(CATEGORIES[i]);
		}
	}
	if (!list.length) {
		return null;
	}
	return list.join(' ');
}

function getPhoneNumber(link, loader, cb) {
	var params = {
		url: link,
		encoding: null,
		followRedirect: true,
		method: 'GET',
		timeout: 30000
	};
	request(params, function (error, res, body) {
		if (error || (res && res.statusCode > 399)) {
			// we ignore errors...
			return cb(null, '');
		}
		body = iconv.decode(body, encoding);
		var $ = loader(body);
		var phone = $('span.emphasis_text05').text().replace(/(\n|\t)/g, '');
		cb(null, phone);
	});
}
