<template>
	<!-- 写作页面 -->
	<view class="wrap">
		<!-- 标题 -->
		<view class="write_title">
			<input type="text" placeholder="请输入标题" v-model="title" />
		</view>
		<!-- 内容展示区 -->
		<view class="artList">
			<block v-for="(item, index) in artList" :key="index">
				<view class="item" v-if="item.type == 'image'">
					<image :src="item.content" :data-index="index" mode="widthFix" @tap="removeImg"></image>
				</view>
				<view class="item" v-if="item.type == 'text'">
					<textarea placeholder="" v-model="artList[index].content" />
					<view :data-index="index" class="deleteText" @tap="deleteText">删除</view>
				</view>
			</block>
		</view>
		<!-- 输入区 -->
		<form @submit="submit">
			<view class="inputArea">
				<view class="addImg" @tap="addImg">+图片</view>
				<view class="addText">
					<textarea name="artText" maxlength="-1" v-model="inputContent" placeholder="请输入文本" />
					<button type="primary" form-type="submit">添加</button>
				</view>
			</view>
		</form>
		<!-- 选则分类 -->
		<view class="art-cate">
			<view>文章分类</view>
			<view>
				<picker mode="selector" :range="caties" @change="cateChange">
					<view>{{caties[currentCateIndex]}}</view>
				</picker>
			</view>
		</view>
		<view class="submitNow" v-if="artList.length > 0" @tap="submitNow">
			<button type="primary">发布文章</button>
		</view>
	</view>
</template>
<script>
var _self, loginRes;
var signModel = require('../../commons/sign.js');
export default {
	data() {
		return {
			title : '',
			artList : [],
			inputContent : "",
			needUploadImg : [],
			uploadIndex : 0,
			//分类
			caties : ['点击选择'],
			currentCateIndex : 0,
			catiesFromApi : [],
			// 记录真实选择的api接口数据的分类id
			sedCateIndex  : 0
		};
	},
	onLoad : function() {
		_self = this;
		loginRes = this.checkLogin('../write/write', '2');
		if(!loginRes){return false;}
		// 签名
		signModel.sign(_self.apiServer);
		// 加载文章分类
		uni.request({
			url: this.apiServer+'category&m=index',
			method: 'GET',
			success: res => {
				if(res.data.status == 'ok'){
					// 把数据格式整理为 picker 支持的格式 ['分类名', ...]
					var categories = res.data.data;
					for(var k in categories){
						_self.caties.push(categories[k]);
					}
					// 记录分类信息
					_self.catiesFromApi = categories;
				}
			}
		});
	},
	onShow:function(){
		loginRes = this.checkLogin('../write/write', '2');
		if(!loginRes){return false;}
		// 重新请签名
		signModel.sign(_self.apiServer);
	},
	methods:{
		cateChange : function(e){
			var sedIndex          = e.detail.value;
			this.currentCateIndex = sedIndex;
			// 获取选择的分类名称
			if(sedIndex < 1){return ;}
			var cateName = this.caties[sedIndex];
			for(var k in this.catiesFromApi){
				if(cateName == this.catiesFromApi[k]){
					this.sedCateIndex = k;
					break;
				}
			}
			this.currentCateIndex = sedIndex;
		},
		removeImg : function(e){
			var index = e.currentTarget.dataset.index;
			uni.showModal({
				content:"确定要删除此图片吗",
				title:'提示',
				success(e) {
					if (e.confirm) {
						_self.artList.splice(index, 1);
					}
				}
			});
		},
		deleteText : function(e){
			var index = e.currentTarget.dataset.index;
			uni.showModal({
				content:"确定要删除吗",
				title:'提示',
				success(e) {
					if (e.confirm) {
						_self.artList.splice(index, 1);
					}
				}
			});
		},
		submitNow : function(){
			// 数据验证
			if(this.title.length < 2){uni.showToast({title:'请输入标题', icon:"none"}); return ;}
			if(this.artList.length < 1){uni.showToast({title:'请填写文章内容', icon:"none"}); return ;}
			if(this.sedCateIndex < 1){uni.showToast({title:'请选择分类', icon:"none"}); return ;}
			// 上传图片 一次一个多次上传 [ 递归函数 ]
			// 上传完成后整体提交数据
			// 首先整理一下需要上传的图片
			// this.needUploadImg = [{tmpurl : 临时地址, index : 数据索引}]
			this.needUploadImg = [];
			for(var i = 0; i < this.artList.length; i++){
				if(this.artList[i].type == 'image'){
					this.needUploadImg.push({"tmpurl" : this.artList[i].content , "indexID" : i});
				}
			}
			console.log(this.needUploadImg);
			this.uploadImg();
		},
		uploadImg : function(){
			// 如果没有图片 或者已经上传完成 则执行提交
			if(this.needUploadImg.length < 1 || this.uploadIndex >=  this.needUploadImg.length){
				//
				uni.showLoading({title:"正在提交"});
				var sign = uni.getStorageSync('sign');
					uni.request({
						url: this.apiServer + 'art&m=add',
						method: 'POST',
						header: {'content-type' : "application/x-www-form-urlencoded"},
						data:{
							title   : _self.title,
							content : JSON.stringify(_self.artList),
							uid     : loginRes[0],
							random  : loginRes[1],
							cate    : _self.sedCateIndex,
							sign    : sign
						},
						success:function(res){
							if(res.data.status == 'ok'){
								uni.showToast({title:"提交成功", icon:"none"});
								_self.artList = [];
								// 清空数据
								signModel.sign(_self.apiServer);
								// 防止数据缓存
								_self.currentCateIndex = 0;
								_self.sedCateIndex     = 0;
								_self.needUploadImg    = [];
								_self.title            = '';
								setTimeout(function(){
									uni.switchTab({
										url:'../my/my'
									})
								}, 1000);
							}else{
								uni.showToast({title:res.data.data, icon:"none"});
							}
						}
					});
				
			}else{
				// 上传图片
				uni.showLoading({title:"上传图片"});
				var uploader = uni.uploadFile({
					url      : _self.apiServer + 'uploadimg',
					filePath : _self.needUploadImg[_self.uploadIndex].tmpurl,
			
					name     : 'file',
					
					success: (uploadFileRes) => {
						
						console.log(uploadFileRes);
						uploadFileRes = JSON.parse(uploadFileRes.data);
						if(uploadFileRes.status != 'ok'){
							uni.showToast({title:"上传图片失败,请重试!", icon:"none"});
							return false;
						}
						// 将已经上传的文件地址赋值给文章数据
						var index = _self.needUploadImg[_self.uploadIndex].indexID;
						_self.artList[index].content = _self.staticServer + uploadFileRes.data;
						_self.uploadIndex ++;
						// 递归上传
						setTimeout(function(){_self.uploadImg();}, 1000);
					},
					fail: (e) => {
						console.log(e);
						uni.showToast({title:"上传图片失败,请重试!", icon:"none"});
					}
				})
			}
		},
		submit : function(res){
			var content = res.detail.value.artText;
			if(content.length < 1){uni.showToast({title:"请输入内容",icon:'none'}); return ;}
			this.artList.push({"type":"text", "content" : content});
			this.inputContent = '';
		},
		addImg : function(){
			uni.chooseImage({
				count: 1,
				sizeType: ['compressed'],
				success: function(res) {
					_self.artList.push({"type":"image", "content" : res.tempFilePaths[0]})
				}
			})
		}
	}
}
</script>

<style lang="less" scoped>
	.wrap {
		margin-left: 20px;
		margin-right: 20px;
		height: 100%;
		display: flex;
		flex-direction: column;
		/* 标题 */
		.write_title {
			height: 50px;
			// background-color: pink;
			border-bottom: 1px solid #eee;
			display: flex;
			// justify-content: center;
			align-items: center;
			// margin-left: 20px;
			// margin-right: 20px;
		}
		/* 内容展示区 */
		.artList {
			margin-top: 20px;
			.item {
				width: 100%;
				text-align:center;
				textarea {
					width: 100%;
					height: 50px;
				}
				.deleteText {
					color: green;
				}
			}
		}
		/* 输入区 */
		form {
			height: 80px;
			margin-top: 20px;
			.inputArea {
				display: flex;
				flex-direction: row;
				height: 100%;
				font-size: 14px;
				.addImg {
					display: flex;
					flex-direction: row;
					justify-content: center;
					align-items: center;
					height: 80px;
					width: 80px;
					background-color: #F8F8F8;
					color: #666;
				}
				.addText {
					display: flex;
					flex-direction: row;
					width: 100%;
					height: 100%;
					textarea {
						display: flex;
						width: 100%;
						height: 100%;
						margin-left: 10px;
						margin-right: 10px;
						padding: 5px 0 0 5px;
						// padding-left: 5px;
						// background-color: #F8F8F8;						
					}
					button {
						display: flex;
						align-items: center;
						justify-content: center;
						width: 50px;
						height: 100%;
						margin: 0 auto;
						padding: 0;
						font-size: 14px;
					}
				}
			}
		}
		// 选则分类
		.art-cate {
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			margin-top: 20px;
			color: #333;
			}
			// 提交按钮
		.submitNow {
			margin-top: 10px;
		}
	}
</style>
