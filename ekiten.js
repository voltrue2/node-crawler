'use strict';

/**
* Usage:
* node ekiten [*log path]
*/

const fs = require('fs');
const crawler = require('./');

const startUrl = 'http://www.ekiten.jp/gen_lesson/';
const limit = 2;
const rate = 100;
const encoding = 'EUC-JP';
const logpath = process.argv[2] || null;

// we need pages with these genres ONLY...
const FILE = __dirname + '/results.' + Date.now() + '.csv';
const LABELS = '"URL","名称","ジャンル","カテゴリー","住所/都道府県","住所/市町村","住所","ウェブサイト","クレジットカード"\n';
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
crawler.addIgnore('/cat_massage/');
crawler.addIgnore('/cat_seitai/');
crawler.addIgnore('/cat_sekkotsu_seikotsu/');
crawler.addIgnore('/cat_shinkyu/');
crawler.addIgnore('/cat_chiropractic/');
crawler.addIgnore('/cat_esthetics_salon/');
crawler.addIgnore('/cat_hair_salon/');
crawler.addIgnore('/cat_barber/');
crawler.addIgnore('/cat_nail_salon/');
crawler.addIgnore('/cat_dentist/');
crawler.addIgnore('/cat_pediatrics/');
crawler.addIgnore('/cat_orthodontics/');
crawler.addIgnore('/cat_otolaryngology/');
crawler.addIgnore('/cat_ophthalmology/');
crawler.addIgnore('/cat_homecare/');
crawler.addIgnore('/cat_dayservice/');
crawler.addIgnore('/cat_recycling/');
crawler.addIgnore('/cat_ticket/');
crawler.addIgnore('/cat_pethotel/');
crawler.addIgnore('/cat_animal_hospital/');
crawler.addIgnore('/cat_pet/');
crawler.addIgnore('/cat_photo_studio/');
crawler.addIgnore('/cat_internal_medicine/');
crawler.addIgnore('/cat_health_beauty_other/');
crawler.addIgnore('/cat_health_beauty_other/');
crawler.addIgnore('/cat_dermatology/');
crawler.addIgnore('/cat_surgery/');
crawler.addIgnore('/cat_psychosomatic_medicine/');
crawler.addIgnore('/cat_psychiatry/');
crawler.addIgnore('/cat_cosmetic_surgery/');
crawler.addIgnore('/cat_obstetrics_gynecology/');
crawler.addIgnore('/cat_car/');
crawler.addIgnore('/cat_orthopedics/');
crawler.addIgnore('/cat_book_usedshop/');
crawler.addIgnore('/cat_old_clothes/');
crawler.addIgnore('/cat_dvd_usedshop/');
crawler.addIgnore('/cat_pawnshop/');
crawler.addIgnore('/cat_box_lunch/');
crawler.addIgnore('/cat_delivery/');
crawler.addIgnore('/cat_house_cleaning/');
crawler.addIgnore('/cat_liquor_store/');
crawler.addIgnore('/cat_cleaning/');
crawler.addIgnore('/cat_babysitter/');
crawler.addIgnore('/cat_housekeeping/');
crawler.addIgnore('/cat_trimmingsalon/');
crawler.addIgnore('/cat_estate_agency/');
crawler.addIgnore('/cat_house_reform/');
crawler.addIgnore('/cat_leased_immovables/');
crawler.addIgnore('/cat_matrimonial_agency/');
crawler.addIgnore('/cat_wedding_hall/');
crawler.addIgnore('/cat_eventhall/');
crawler.addIgnore('/cat_funeral/');
crawler.addIgnore('/cat_restaurant/');
crawler.addIgnore('/cat_grogshop/');
crawler.addIgnore('/cat_sweets/');
crawler.addIgnore('/cat_cafe/');
crawler.addIgnore('/cat_roast_meat/');
crawler.addIgnore('/cat_japanese_food/');
crawler.addIgnore('/cat_bar/');
crawler.addIgnore('/cat_ramen/');
crawler.addIgnore('/cat_hotel/');
crawler.addIgnore('/cat_travel_agent/');
crawler.addIgnore('/cat_fitness/');
crawler.addIgnore('/cat_rental_car/');
crawler.addIgnore('/cat_shoes/');
crawler.addIgnore('/cat_bag/');
crawler.addIgnore('/cat_accessory/');
crawler.addIgnore('/cat_fashion/');
crawler.addIgnore('/cat_supermarket_food/');
crawler.addIgnore('/cat_bookstore/');
crawler.addIgnore('/cat_department/');
crawler.addIgnore('/cat_consumer_electronic/');

crawler.onData(function (url, body, loader) {
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
		// discard
		return false;
	}
	// we determine if the page is a list or a target page
	if (body.indexOf(TARGET_TAG) === -1) {
		// this is a list page: no need to parse the page
		return true;
	}
	// this is a target page: parse the page now
	var $ = loader(body);
	var leftBlock = loader($('div.left_block').html());
	var name = leftBlock('span[itemprop="name"]').text();
	var genres = leftBlock('div.shop_genre').text();
	var categories = getCategories(leftBlock('div.cat_list').text());
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
	// write to the file
	var row = '"' + crawler.getHost() + url + '","' +
		name + '","' +
		genres + '","' +
		categories + '","' +
		prefecture + '","' +
		ward + '","' +
		street + '","' +
		links.join(' ') + '","' +
		creditCard + '"\n';
	fs.appendFile(FILE, row, doNothing());
	// move on
	return true;
});

// start with creating the result file first with the label columns
fs.appendFileSync(FILE, LABELS);

crawler.start(startUrl, limit, rate, encoding, logpath);

function getCategories(text) {
	var list = [];
	for (var i = 0, len = CATEGORIES.length; i < len; i++) {
		if (text.indexOf(CATEGORIES[i]) !== -1) {
			list.push(CATEGORIES[i]);
		}
	}
	return list.join(' ');
}

function doNothing() {}

