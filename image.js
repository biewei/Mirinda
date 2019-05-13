;(function($,win,doc,undefined){

    // 样式配置
    var _style = {
        cvsframe:{
            backgroundColor: "rgba(0,0,0,0.7)",
            position: "fixed",
            overflow: "auto",
            width: "100%",
            height: "100%",
            zIndex: "99",
        },
        cvsPanel:{
            width: "1100px",
            height: "100%",
            overflow: "hidden",
        },
        cvsCoat:{
            width: "1000px",
            height: "100%",
            overflow: "auto",
        },
        tools:{
            backgroundColor: "#eee",
            width: "90px",
            height: "100%",
            minHeight: "800px",
            paddingLeft: "10px",
            float: "left",
            userSelect: "none",
        },
        cover:{
            background: "#9BF460",
            position: "absolute",
            border: "1px solid #f00",
            display: "none",
            opacity: "0.5",
        }
    }

    // 工具集
    var _toolSet = {
        mosaic: "手动马赛克",
        directWatermark: "直接加水印",
        selectWatermark: "手动加水印"
    };

    // 操作集
    var _operateSet = {
        revert: "撤销",
        confirm: "保存",
        cancel: "关闭",
    };

    // 默认配置
    var _default = {
        watermarkTransparency: 0.4, //水印透明度
    };


    /**
     * 汇商所图像处理库
     * @param {array} option 自定义参数
     */
    function HssImg(option) {
        this.body = doc.getElementsByTagName("html")[0];
        // 画布
        this.canvas,
        this.ctx,
        // 工具集
        this.toolSet = _toolSet;
        this.operateSet = _operateSet;
        this.style = _style;
        // 栈内存
        this.stack = [];
        // 工具栏
        this.tools = {};
        // 操作集
        this.operate = {};
        // 当前动作
        this.action = '';
        // 初始化
        this._init(option);
    }


    // 绑定事件
    HssImg.prototype = {

        constructor: this,

        // 初始化函数
        _init: function(opt) {
            for(var o in opt)
                this[o] = opt[o];

            for(var o in _default)
                this[o] = _default[o];
        },

        /**
         * 打开画布
         */
        onCvs: function(obj, src) {

            // 绑定外部对象
            this.bindObject = obj;

            // 创建画布
            this.createcvs();
            this.addTool();
            this.addOperate();

            // 渲染到画布
            this._draw(src);
        },

        /**
         * 创建全屏画布
         */
        createcvs: function() {
            // 外层画框
            this.cvsframe = doc.createElement("div");
            var frameAttr = doc.createAttribute("id");
                frameAttr.value = "cvsframe";
            this.cvsframe.setAttributeNode(frameAttr);

            // 画板
            this.cvsPanel = doc.createElement("div");
            var panelAttr = doc.createAttribute("id");
                panelAttr.value = "cvsPanel";
            this.cvsPanel.setAttributeNode(panelAttr);

            // tools
            this.tools = doc.createElement("div");
            var toolsAttr = doc.createAttribute("id");
                toolsAttr.value = "tools";
            this.tools.setAttributeNode(toolsAttr);

            // 画布外框
            this.cvsCoat = doc.createElement("div");
            var coatAttr = doc.createAttribute("id");
                coatAttr.value = "cvsCoat";
            this.cvsCoat.setAttributeNode(coatAttr);

            // 画布
            this.canvas = doc.createElement("canvas");
            var canvasAttr = doc.createAttribute("id");
                canvasAttr.value = "canvas";
            this.canvas.setAttributeNode(canvasAttr);

            // 提示遮罩
            this.cover = doc.createElement("div");
            var coverAttr = doc.createAttribute("id");
                coverAttr.value = "cover";
            this.cover.setAttributeNode(coverAttr);

            // 设置样式
            for(var option in this.style)
                for(var s in this.style[option]){
                    this[option].style[s] = this.style[option][s]
                }

            // 设置水印
            this.watermark = new Image();
            this.watermark.src = "/NewStyle/H/himg/logo.png";
            
            this.cvsCoat.appendChild(this.canvas);
            this.cvsCoat.appendChild(this.cover);
            this.cvsPanel.appendChild(this.tools);
            this.cvsPanel.appendChild(this.cvsCoat);
            this.cvsframe.appendChild(this.cvsPanel);

            this.body.insertBefore(this.cvsframe, this.body.firstChild);
        },

        /**
         * 添加处理工具
         */
        addTool: function() {

            for(var t in this.toolSet){
                this.tools[t] = doc.createElement('button');
                var btnAttr = doc.createAttribute("class");
                    btnAttr.value = t;

                this.tools[t].setAttributeNode(btnAttr);
                this.tools[t].innerHTML = this.toolSet[t];
                if(t == 'mosaic'){
                    this.tools[t].style.backgroundColor = "#000";
                    this.tools[t].style.color = "#fff";
                    this.action = t;
                }else{
                    this.tools[t].style.backgroundColor = "#fff";
                    this.tools[t].style.color = "#000";
                }
                this.tools[t].style.border = "none";
                this.tools[t].style.marginTop = '30px';
                this.tools[t].style.padding = '5px';

                var _self = this;
                this.tools[t].onclick = function(){
                    _self._bind(this);
                }

                // 添加到工具栏
                this.tools.appendChild(this.tools[t]);
            }
        },


        /**
         * 添加操作按钮
         */
        addOperate: function() {

            for(var o in this.operateSet){
                this.operate[o] = doc.createElement('button');
                var btnAttr = doc.createAttribute("class");
                    btnAttr.value = o;

                this.operate[o].setAttributeNode(btnAttr);
                this.operate[o].innerHTML = this.operateSet[o];

                this.operate[o].style.backgroundColor = "#fff";
                this.operate[o].style.color = "#000";
                this.operate[o].style.marginTop = '30px';
                this.operate[o].style.padding = '5px';

                var _self = this;
                this.operate[o].onclick = function(){
                    // 捕捉动作选项
                    var option = this.getAttribute("class");

                    if(option == "revert"){
                        _self._revert();
                    }
                    else if(option == 'confirm'){
                        _self._confirm();
                    }
                    else if(option == 'cancel'){
                        _self.cvsframe.remove();
                    }
                }

                // 添加到工具栏
                this.tools.appendChild(this.operate[o]);
            }

        },


        /**
         * 撤销操作
         */
        _revert: function(){
            // 前一次操作
            var last = this.stack.pop();
            if (last) {
                this.ctx.putImageData(last.content, 0 , 0 , 0 , 0 , this.canvas.width, this.canvas.height);
                if(last.option == 'watermark'){
                    this.exists_watermark = null;
                }
            }
        },


        /**
         * 保存图像
         */
        _confirm: function(){
            // 输出画布内容到绑定对象
            this.bindObject.src = this.canvas.toDataURL('image/jpeg');
            this.stack = [];
            this.exists_watermark = null;

            // 移除监听
            $(document).off('keydown');

            document.getElementById("cvsframe").remove();
        },


        /**
         * 渲染到画布
         */
        _draw: function(imgSrc){

            // 获取画布
            this.ctx = this.canvas.getContext('2d');

            var _self = this;
            var img = new Image();
                // 设置跨域访问
                img.crossOrigin = "anonymous";
                img.src = imgSrc;

            img.onload = function () {
                //缩小图片
                var w = img.width;
                var h = img.height;
                // 限制图像大小
                if(w > 1000){
                    h = h * (1000 / w);
                    w = 1000;
                }
                _self.canvas.width = w;
                _self.canvas.height = h;
                _self.ctx.drawImage(img, 0, 0, _self.canvas.width, _self.canvas.height);

                canvas.onmousedown = function(e) {
                    var e = e ||event;
                    var ox = e.offsetX;
                    var oy = e.offsetY;
                    var kx = e.clientX;
                    var ky = e.clientY;

                    // Canvas外框滚动条
                    var sTop = $("#cvsframe").scrollTop();
                    var sLeft = $("#cvsframe").scrollLeft();

                    // 示意层样式
                    _self.cover.style.top = parseInt(ky + sTop)+'px';
                    _self.cover.style.left = parseInt(kx + sLeft)+'px';
                    _self.cover.style.width = _self.cover.style.height = 0;
                    _self.cover.style.display = 'block';

                    document.onmousemove = function(e){
                        var w = parseInt(e.clientX - kx);
                        var h = parseInt(e.clientY - ky);
                        _self.cover.style.width  = w + 'px';
                        _self.cover.style.height = h + 'px';
                    }

                    document.onmouseup  = function(e){
                        var W = parseInt(_self.cover.style.width);
                        var H = parseInt(_self.cover.style.height);

                        if(W > 0 && H > 0){
                            if(_self.action == 'mosaic'){
                                // 保存快照到栈内
                                _self._snapshot('mosaic');
                                // 马赛克处理
                                _self.mosaic(ox, oy, W, H);
                            }else if(_self.action == 'selectWatermark'){
                                // 在选中区域添加水印
                                _self._watermark(ox, oy, W, H);
                            }
                        }
                        _self.cover.style.display = 'none';
                        document.onmousemove = null;
                        document.onmouseup = null;
                    }
                }

                //键盘监听
                $(document).keydown(function(event){
                　　if(event.ctrlKey && event.keyCode == 90){
                        _self._revert();
                    }else if(event.ctrlKey && event.keyCode == 83){
                        _self._confirm();
                    }
                    return false;
                });

            }
        },


        /**
         * 水印处理
         * @param {int} x 水印起始位置x坐标
         * @param {int} y 水印起始位置y坐标
         * @param {int} W 加水印区域宽
         * @param {int} H 加水印区域高
         */
        _watermark: function(x, y, W, H){

            if(!this.exists_watermark){

                // 保存快照到栈内
                this._snapshot('watermark');

                // 设置透明度并加水印
                this.ctx.globalAlpha = this.watermarkTransparency;

                var lh = parseInt(W * 0.30);
                var lt = parseInt((H - lh) / 2 + y);

                // 旋转的原点为选中位置的中心
                var xx = parseInt(x+(W/2));
                var yy = parseInt(y+(H/2));

                this.ctx.save();//保存状态
                this.ctx.translate(xx, yy);//设置画布上的(0,0)位置，也就是旋转的中心点
                this.ctx.rotate(26*Math.PI/180);
                /**
                 *  tmpRate 这个阈值是手动测试出来的，不适用于其他水印，
                 *  应该用转换后的角度算一个三角形的值得方式求出这个阈值
                 *  等有时间好好研究，先这样用一阵子
                 */
                var tmpRate = 1.20;
                if(H*tmpRate < W){
                    var TW = H * tmpRate;
                    lh = TW * 0.30;
                }else{
                    var TW = W;
                }
                this.ctx.drawImage(this.watermark, -(TW/2), -(lh/2), TW, lh);//把图片绘制在旋转的中心点，
                this.ctx.restore();//恢复状态

                this.exists_watermark = true;
            }

        },


        /**
         * 马赛克处理
         */
        mosaic: function(mx, my, w, h){

            // 获取图片数据
            var imageData = this.ctx.getImageData( 0 , 0 , this.canvas.width , this.canvas.height );
            var pixelData = imageData.data;

            var enda = mx+w;
            var endb = my+h;

            var size = parseInt((w+h) / 16)>10 ? parseInt((w+h) / 16) : 10;
                size = size > 60 ? 60 : size;
            var totalnum = size*size;

            // 调整 i 和 j 可以指定打码位置
            for( var i = my ; i < endb ; i += size )
                for( var j = mx ; j < enda ; j += size ){
                    //这块是计算每一块全部的像素值--平均值
                    var totalr = 0, totalg = 0, totalb = 0;
                    for( var dx = 0 ; dx < size ; dx ++ )
                        for( var dy = 0 ; dy < size ; dy ++ ){
                            var x = i + dx;
                            var y = j + dy;
                            var p = x*this.canvas.width + y;
                            totalr += pixelData[p*4+0];
                            totalg += pixelData[p*4+1];
                            totalb += pixelData[p*4+2];
                        }
                    var p = i*this.canvas.width+j;
                    var resr = totalr / totalnum;
                    var resg = totalg / totalnum;
                    var resb = totalb / totalnum;
                    //这个块像素的值=它的平均值
                    for( var dx = 0 ; dx < size ; dx ++ )
                        for( var dy = 0 ; dy < size ; dy ++ ){
                            var x = i + dx;
                            var y = j + dy;
                            var p = x*this.canvas.width + y;
                            pixelData[p*4+0] = resr;
                            pixelData[p*4+1] = resg;
                            pixelData[p*4+2] = resb;
                        }
                }
            // 偏移量等于div指示框线宽
            this.ctx.putImageData( imageData , 1 , 1 , mx , my , w, h );
        },


        /**
         * 拍摄快照
         */
        _snapshot: function(opt){
            this.stack.push({
                option: opt,
                content : this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
            });
        },


        /**
         * 绑定事件
         */
        _bind: function(option){
            // 捕捉当前动作
            this.action = option.getAttribute('class');

            for(var t in this.toolSet)
                if(t != this.action){
                    this.tools[t].style.backgroundColor = "#fff";
                    this.tools[t].style.color = "#000";
                }else{
                    option.style.backgroundColor = "#000";
                    option.style.color = "#fff";
                    if(this.action == 'directWatermark'){
                        var W = this.canvas.width;
                        var H = this.canvas.height;
                        var ox = 0, oy = 0;
                        this._watermark(ox, oy, W, H);
                    }
                }
         },

    }


    // 赋值到window
    win.HssImg = HssImg;
}(jQuery,window,document))