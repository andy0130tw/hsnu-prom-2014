/*! Global variables */
var routeSelector={};
var cacheStorage={};
var originalTitle;

/*! Constants */
var FX_SLIDE_DURATION=500;
var FX_MFP_REMOVAL_DELAY=250;
var termTranslation={
	"home":"首頁",
	"news":"新聞報導",
	"decoration":"校園佈置",
	"show":"活動實況",
	"souvenir":"紀念品",
	"video":"相關影片",
	"tech":"技術",
	"404":"Error 404",
	"http_error":"Loading Error"
};
var CONST_AFFIX_SETTINGS={
		offset:{
			top: 10+$("#header").outerHeight(true),
			bottom: function(){
				return 30+($(this).bottom=$('#footer').outerHeight(true)+$("#social-button-container").outerHeight(true));
			}
		}
	};


/*! polyfill from mdn */
Array.prototype.indexOf||(Array.prototype.indexOf=function(r,t){if(void 0===this||null===this)throw new TypeError('"this" is null or not defined');var i=this.length>>>0;for(t=+t||0,1/0===Math.abs(t)&&(t=0),0>t&&(t+=i,0>t&&(t=0));i>t;t++)if(this[t]===r)return t;return-1});

/*! util */
var modal={
	show:function(src,isModal,effects){
		$.magnificPopup.open({items:{src:$(src)},modal:isModal,mainClass:"mfp-fade "+effects,type:"inline"});
	},
	image:function(src,title){
		$.magnificPopup.open({items:{src:src,title:title},type:"image"});
	}
};

function thumbFN(item,basePath){if(!item.src)return "";return "image/thumb/"+(basePath?basePath+"/":"")+item.src}
function imageFN(item,basePath){if(!item.src)return "";return "image/photo/"+(basePath?basePath+"/":"")+item.src}
function fill(n,digit){
	n=""+n;
	while(n.length<digit)n="0"+n;
	return n;
}
function translateMFP(){
	$.extend(true, $.magnificPopup.defaults, {
		
		mainClass:"mfp-fade",
		removalDelay:FX_MFP_REMOVAL_DELAY,

		tClose: '關閉 (ESC)',
		tLoading: '載入中…',
		gallery: {
			tPrev: '上一張 (←)',
			tNext: '下一張 (→)',
			tCounter: '%curr% / %total%',
			preload: [2,4], 
		},
		image: {
			tError: '<a href="%url%">本圖片</a>無法載入！',
			titleSrc: function(item) {
				var title=item.el?item.el.attr('title'):item.src;
				/*item.el.attr('title')  &middot; */
				return (title?title+' &middot; ':"")
					+'<a class="mfp-link-original" href="'+item.src+'" target="_blank">顯示原圖</a>';
			}
		},
		ajax: {tError: '<a href="%url%">本內容</a>無法載入！'},
		inline: {tNotFound: '找不到引用的內容。請通知網頁作者！'}
	});
}

function hashIsDerived(){
	// return true only when two hashes match the same callback
	var prev=routie.find(routie.previous());
	var now=routie.find();
	if(prev===null||now===null)return false;
	return prev.is(now);
}


function deferredRoute(reqElem,reqUrl,navStr,cb){
	return function(){
		if(navStr){
			navUpdate(navStr);
			originalTitle=originalTitle||document.title;
			var titleText=termTranslation[navStr]||navStr;
			if(titleText!=="")titleText=titleText+=" | ";
			document.title=(titleText||navStr)+originalTitle;
		}
		var that=this;
		var arg=arguments;
		var cbCaller=function(){
			var result;
			if(cb)result=cb.apply(that,arg);
		};
		if(!$(reqElem)||!$(reqElem).length){
			//console.log("[deferredRoute] deferred. waiting ",reqUrl);
			loadExt(reqUrl,function(resp){
				//console.log("[deferredRoute] now ok.");
				cbCaller();
			});
		}else{
			cbCaller();
		}
	};
}

/*! for generating routes' definition */
function albumDeferredRouteFactory(base){
	//I am so lazy >/////<
	var baseHash="!/"+base;
	var sel="#"+base+"-content";
	return deferredRoute(sel,"ajax/"+base+".html",base,function(num){
		var ctrl=$(sel);
		var items=ctrl.data("mfp-items");
		var mfp=$.magnificPopup.instance;
		var idx=num-1;
		if(!items){
			//collect elements and save them
			items=[];
			ctrl.find(".cell > a").each(function(){
				items.push(this);
			});
			ctrl.data("mfp-items",items);
		}
		if(num){
			if(num<0)return;
			if(idx>=items.length)return;
			$.magnificPopup.open({
				items:ctrl.data("mfp-items"),
				gallery:{enabled:true},
				type:"image",
				callbacks:{
					beforeClose:function(){
						var newHash=routie.findAll()[0].toURL({});
						routie.navigate(newHash,{silent:true});
					},
					change:function(){
						var newHash=routie.findAll(baseHash)[1].toURL({num:mfp.index+1});
						routie.navigate(newHash,{silent:true});
					}
				}
			},idx);
		}else mfp.close();

	});
}

function initHashHandler(){
	var beforeRoutieHashChange=function(){
		//bind BEFORE routie in order to clear hash
		//as soon as the event is triggered.
		if(["","#!","#!/"].indexOf(location.hash)>=0){
			//powered by History API.
			//try to clear hash in url bar
			//history.replaceState in IE may exist, but
			//useless (IE sucks!) so we use try ... catch
			//to suppress errs.
			try{
				history.replaceState({},document.title,location.href.split('#')[0]);
			}catch(e){}
		}
	};
	$(window).hashchange(beforeRoutieHashChange);
	//trigger it manually
	beforeRoutieHashChange();

	//defining different routes
	var homeRoute=deferredRoute("#home-content","ajax/landing.html","home");
	var newsRoute=deferredRoute("#news-content","ajax/news.html","news",function(section){
		if(section){
			var elem=$("#news-content").find("[data-hashid='"+section+"']").eq(0);
			// -3 for affix handling
			if(elem.length)
				slideTo(elem.offset().top-$("#menu-wrapper").innerHeight()-3);
			else
				slideTo(0);
		}
	});
	var techRoute=deferredRoute("#tech-content","ajax/tech.html","tech",function(section){
		if(section){
			var elem=$("#tech-content").find("[data-hashid='"+section+"']").eq(0);
			// -3 for affix handling
			if(elem.length)
				slideTo(elem.offset().top-$("#menu-wrapper").innerHeight()-3);
			else
				slideTo(0);
		}
	});
	var videoRoute=deferredRoute("#video-content","ajax/video.html","video",function(num){
		if(num){
			if(num<=0)return;
			var ctrl=$("#popup-video");
			var self=$("#video-content").find(".action-video").eq(num-1);
			if(!self.length)return;

			$.magnificPopup.open({
				type:"inline",
				items:{src:ctrl},
				callbacks:{
					beforeClose:function(){
						var newHash=routie.findAll()[0].toURL([]);
						routie.navigate(newHash,{silent:true});
					}
				}
			});
			ctrl.find("h2").html(self.data("title"));
			ctrl.find("iframe").attr("src","http://www.youtube.com/embed/"+self.data("id")+"?rel=0");
		}
	});
	var showRoute=albumDeferredRouteFactory("show");
	var decorationRoute=albumDeferredRouteFactory("decoration");
	var souvenirRoute=albumDeferredRouteFactory("souvenir");
	//default entry, disable cache
	var rescue=deferredRoute("","ajax/404.html","404");
	routeSelector={
		'':homeRoute,'!':homeRoute,'!/':homeRoute,
		'!/news':newsRoute,
		'!/news/:section?':newsRoute,
		'!/tech':techRoute,
		'!/tech/:section?':techRoute,
		'!/video':videoRoute,
		'!/video/:num?':videoRoute,
		'!/show':showRoute,
		'!/show/:num?':showRoute,
		'!/souvenir':souvenirRoute,
		'!/souvenir/:num?':souvenirRoute,
		'!/decoration':decorationRoute,
		'!/decoration/:num?':decorationRoute,
		//the order of the route is important.
		//therefore, the wildcard MUST be placed at last.
		'*':rescue
	};
	routie.before(function(oldOne,newOne){
		var mfp=$.magnificPopup.instance;
		if(!hashIsDerived()&&mfp.isOpen)mfp.close();
	});
	routie(routeSelector);
}

/*! starting up */
function main(){
	initPlugins();
	translateMFP();
	registerListeners();
	initSocial();
	initHashHandler();
	console.log("Welcome, the developer. I've been here, waiting for you for a long time!");
};

function initSocial(){
	var l=location.href.split('#')[0];
	var t=document.title;
	var l2=encodeURIComponent(l);
	var ctrl=$("#social-button-container");
	ctrl.children("._fb").replaceWith(
		'<div class="fb-like" data-href="'+l+'"'
		+' data-layout="button_count" data-action="like"'
		+' data-show-faces="false" data-share="false">[Facebook]</div>');
	ctrl.children("._twttr").replaceWith(
		'<a href="https://twitter.com/share" class="twitter-share-button"'
		+' data-url="'+l+'" data-via="andy0130tw"'
		+' data-lang="en">Tweet</a>');
	ctrl.children("._gplus").replaceWith('<div class="g-plusone" data-size="medium">[Google+]</div>');
	gapi.plusone.go();

	var ctrl2=ctrl.children("div.fill-social-buttons");
	ctrl2.children(".facebook").click(function(){return void(window.open('http://www.facebook.com/share.php?u='+l2))});
	ctrl2.children(".googleplus").click(function(){return void(window.open('https://plus.google.com/share?url='+l2))});
	ctrl2.children(".plurk").click(function(){return void(window.open('http://www.plurk.com/?qualifier=shares&status='+l2+' ('+t+')'))});
	ctrl2.children(".twitter").click(function(){return void(window.open('http://twitter.com/home/?status='+t+' | '+l2))});
}

function initPlugins(){
	$.fn.htmlWithScript=function(raw){
		//strip out <script> tag and wrap into closures,
		// ensuring that they are invoked locally.
		// they won't retain after execution.
		var self=$(this);
		return this.each(function(){
			var data=$.parseHTML(raw,document,true);
			var snippet=[];
			for(var i=0;i<data.length;++i){
				var frag=data[i];
				var tagN=frag.tagName;
				if(tagN&&tagN.toLowerCase()=="script"){
					snippet.push(frag.innerHTML);
					//strip it out
					data[i]="";
				}
			}
			//change content
			self.empty().html(data);
			//separate different snippets. then execute them.
			var code=snippet.join("\n");
			(function(){eval(code)}).call(self);
		});
	};
	$.fn.gallery=function(items,basePath,hashString){
		//for debug, set debug = true and replace it
		//var thumbFactory=debug?imageFN:thumbFN;
		var self=$(this);
		basePath=basePath||"";
		return this.each(function(){
			if(items){
				//create gallery
				var buf="";
				for(var i=0;i<items.length;++i){
					var item=items[i];
					var title=item.title||"";
					buf+="<div class='cell'>"
						+"<a href='"+imageFN(item,basePath)
						+"' title='"+title
						+"'><img src='"+thumbFN(item,basePath)
						+"'/></a></div>";
				}
				//delegate event
				self.addClass("gallery-grid clearfix")
					.empty().html(buf)
					.on("click",".cell",function(){
						var num=$(this).index();
						routie.navigate("#!/"+(hashString||basePath)+"/"+(num+1));
						return false;
					});
			}else{
				//destroy gallery
				self.removeClass("gallery-grid").empty();
			}
		});
	};
}

function registerListeners(){
	
	$("img.logo").click(function(){
		modal.image($(this).attr("src").split("logo.").join("logo-ori."),"LOGO");
	});

	$("#link-cpyr").click(function(){
		modal.show("#popup-copyright",false,"mfp-zoom");
	});

	$("#menu-toggle").click(function(){
		$("#menu-inner").toggleClass("expand");
	});

	$("#menu-inner").on("click","li",function(){
		var href=$(this).children("a").attr("href");
		//if not hash, follow default action
		if(!href||href.indexOf("#!")!=0)return true;
		//if not complete, nav bar is disabled to avoid glitches
		if(!$("#content").hasClass("complete"))return false;
		routie(href);
		//to ensure in mobile screen,
		//the menu will shrink
		$("#menu-inner").removeClass("expand");
		//return to top
		slideTo();
		return false;
	});
}

/*! navigation helpers */
function slideTo(elemOrNum){
	var dest=0;
	if(typeof elemOrNum=="number")dest=elemOrNum;
	else if(elemOrNum)dest=$(elemOrNum).offset().top||0;
	$("body,html").animate({scrollTop:dest},FX_SLIDE_DURATION);
}

function navUpdate(term){
	//default
	if(term==="")term="#!";
	var ctrl=$("#menu-inner");
	var oldOne=ctrl.find("li.active");
	var newOne=ctrl.find("li > a[data-term='"+term+"']").parent();
	if(oldOne[0]!==newOne[0]){
		oldOne.removeClass("active");
		newOne.addClass("active");
	}
}

function replaceHash(newHash){
	//Used when you want to force the hash change. 
	if(location.hash=="#"+newHash||location.hash==newHash){
		//should trigger event manually
		$(window).hashchange();
	}
	else routie(newHash);
}

function loadExt(url,callback){
	var ctrl=$("#content");
	ctrl.addClass("loading").removeClass("complete");
	//check cache. If exists, go success directly
	// with storaged html as resp.
	var x;
	var sucCB=function(resp){
		setTimeout(function(){
			ctrl.removeClass("loading").addClass("complete");
			ctrl.htmlWithScript(resp);
			if(callback)callback(resp);
		},FX_SLIDE_DURATION);
	};
	if(x=cacheStorage[url]){
		//console.log("[loadExt] fetched from cache: "+url);
		sucCB(x);
	}
	else
		$.ajax(url,{
			dataType:"html",
			success:function(resp){
				cacheStorage[url]=resp;
				//console.log("[loadExt] fetched from ajax: "+url);
				sucCB(resp);
			},
			error:function(jqXHR,textStatus,errorThrown){
				//not update nav, exec now
				deferredRoute("","ajax/http_error.html","",function(){
					$(".fill-status").html(textStatus);
					$(".fill-errmsg").html(errorThrown.toString());
				})();
			}
		});
}

$(main);