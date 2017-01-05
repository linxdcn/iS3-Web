/**
 * @file
 * @author Lin Xiaodong<linxdcn@gmail.com>
 */

/* globals iS3 */
/* globals iS3Project */
/* globals ol */
/* globals jsts */
/* globals hull */

/**
 * Construction function
 * The status codes for the panopoints are as follow
 * 0: qualified panopoints
 * 1: picture deleted points
 * 2: isolated deleted points
 * 3: repeated deleted points
 * 4: link deleted points
 *
 * @param {iS3.toolbar.Toolbar} toolbar Toolbar
 * @constructor
 */
iS3.toolbar.GisQualityControl = function (toolbar) {
    this.QUALIFIED = 0;
    this.PICTURE = 1;
    this.ISOLATED = 2;
    this.REPEATED = 3;
    this.LINK = 4;
    var thisCpy = this;

    var draggableDiv;
    iS3.toolbar.BasicControl.call(this, {
        label: ' ',
        tipLabel: iS3Project.getConfig().lang.gisQualifiedTip,
        className: 'iS3-gisquality ol-unselectable ol-control',
        trigger: function () {
            if (!draggableDiv) {
                draggableDiv = thisCpy.getGISQualityDiv(toolbar);
            }
            if (draggableDiv.isVisible()) {
                draggableDiv.close();
            }
            else {
                draggableDiv.show();

                // initial source layer and target layer
                var childrent = toolbar.layertree.layerContainer.childNodes;
                var target = document.getElementById('gis-qualified-target');
                for (var child in childrent) {
                    if (childrent[child].nodeType === 1
                        && toolbar.layertree.getLayerDefById(childrent[child].id).layertype
                        === iS3.LayerDef.layerType.PANOPOINT) {
                        var option = document.createElement('option');
                        option.value = childrent[child].id;
                        option.textContent = childrent[child].title;
                        target.appendChild(option);
                    }
                }
            }
        }
    });
};
ol.inherits(iS3.toolbar.GisQualityControl, iS3.toolbar.BasicControl);

/**
 * Create gis quality div
 *
 * @param {iS3.toolbar.Toolbar} toolbar Toolbar
 * @return {iS3.DraggableDiv} Div element
 */
iS3.toolbar.GisQualityControl.prototype.getGISQualityDiv = function (toolbar) {
    var lang = iS3Project.getConfig().lang;
    var pictureColor = '#8B008B';
    var isolatedColor = '#8B008B';
    var repeatedColor = '#FFD700';
    var linkColor = '#FF69B4';
    var markedColor = '#66CD00';
    var tipColor = '#FF69B4';
    var thisCpy = this;

    var layertree = toolbar.layertree;
    var gisGISQualityDiv = new iS3.DraggableDiv({
        id: 'gisquality',
        title: iS3Project.getConfig().lang.gisQualifiedTip
    });
    var GISQualityForm = document.createElement('form');
    GISQualityForm.id = 'gisQualityForm';
    GISQualityForm.className = 'draggable-form';
    GISQualityForm.addEventListener('submit', function (evt) {
        evt.preventDefault();
        var selectedLayer = layertree.getLayerById(layertree.selectedLayer.id);
        var targetLayer = layertree.getLayerDefById(this.target.value);
        iS3.toolbar.GisQualityControl.mergePoints(selectedLayer, targetLayer);
        gisGISQualityDiv.close();
    });
    var GISQualityTable = document.createElement('table');

    // first row
    var firstRow = document.createElement('tr');
    var row11 = document.createElement('td');
    row11.textContent = lang.pictureDeletedPoints;
    firstRow.appendChild(row11);

    var row12 = document.createElement('td');
    var fileInput = document.createElement('input');
    fileInput.name = 'file';
    fileInput.type = 'file';
    fileInput.onchange = function () {
        iS3.toolbar.GisQualityControl.autoMarkPicturedPoints(fileInput.files[0], thisCpy.PICTURE, pictureColor);
    };
    row12.appendChild(fileInput);
    firstRow.appendChild(row12);

    // second row
    var secondRow = document.createElement('tr');
    var row21 = document.createElement('td');
    row21.textContent = lang.isolatedDeletedPoints;
    secondRow.appendChild(row21);
    var row22 = document.createElement('td');
    var isolatedAuto = document.createElement('input');
    isolatedAuto.type = 'button';
    isolatedAuto.value = lang.auto;
    isolatedAuto.onclick = function () {
        this.disabled = true;
        var isoBtn = this;
        setTimeout(function () {
            iS3.toolbar.GisQualityControl.autoMarkIsolatedPoints(thisCpy.ISOLATED, markedColor);
            isoBtn.disabled = false;
        }, 100);
    };
    row22.appendChild(isolatedAuto);
    var isolatedBtn = document.createElement('input');
    isolatedBtn.id = 'gischeck-mark-isolated';
    isolatedBtn.type = 'button';
    isolatedBtn.value = lang.markSelected;
    isolatedBtn.onclick = function () {
        iS3.toolbar.GisQualityControl.markFeatures(
            toolbar.selectInteraction.getFeatures(), thisCpy.ISOLATED, markedColor);
    };
    row22.appendChild(isolatedBtn);
    row22.appendChild($('<span>按键1</span>').get(0));
    secondRow.appendChild(row22);

    // insert row 1
    var insertRow1 = document.createElement('tr');
    var rowi31 = document.createElement('td');
    rowi31.textContent = lang.repeatedDeletedPoints;
    insertRow1.appendChild(rowi31);
    var rowi32 = document.createElement('td');
    var reptAuto = document.createElement('input');
    reptAuto.id = 'auto-repeated-mark';
    reptAuto.type = 'button';
    reptAuto.value = lang.auto;
    reptAuto.onclick = function () {
        reptAuto.disabled = true;
        setTimeout(function () {
            var targetLayer = layertree.getLayerDefById(
                document.getElementById('gisQualityForm').target.value);
            iS3.toolbar.GisQualityControl.autoMarkRepeatedPoints(targetLayer, thisCpy.REPEATED, tipColor);
        }, 100);
    };
    rowi32.appendChild(reptAuto);
    var reptBtn = document.createElement('input');
    reptBtn.id = 'gischeck-mark-repeated';
    reptBtn.type = 'button';
    reptBtn.value = lang.markSelected;
    reptBtn.onclick = function () {
        iS3.toolbar.GisQualityControl.markFeatures(
            toolbar.selectInteraction.getFeatures(), thisCpy.REPEATED, markedColor);
    };
    rowi32.appendChild(reptBtn);
    rowi32.appendChild($('<span>按键2</span>').get(0));
    insertRow1.appendChild((rowi32));

    // third row
    var thirdRow = document.createElement('tr');
    var row31 = document.createElement('td');
    row31.textContent = lang.linkDeletedPoints;
    thirdRow.appendChild(row31);
    var row32 = document.createElement('td');
    var linkBtn = document.createElement('input');
    linkBtn.id = 'gischeck-mark-link';
    linkBtn.type = 'button';
    linkBtn.value = lang.markSelected;
    linkBtn.onclick = function () {
        iS3.toolbar.GisQualityControl.markFeatures(
            toolbar.selectInteraction.getFeatures(), thisCpy.LINK, markedColor);
    };
    row32.appendChild(linkBtn);
    row32.appendChild($('<span>按键3</span>').get(0));
    thirdRow.appendChild((row32));

    // insert row 2
    var insertRow2 = document.createElement('tr');
    var rowi41 = document.createElement('td');
    rowi41.textContent = lang.reset;
    insertRow2.appendChild(rowi41);
    var rowi42 = document.createElement('td');
    var resetBtn = document.createElement('input');
    resetBtn.id = 'gischeck-mark-reset';
    resetBtn.type = 'button';
    resetBtn.value = lang.markSelected;
    resetBtn.onclick = function () {
        iS3.toolbar.GisQualityControl.resetFeatures(
            toolbar.selectInteraction.getFeatures());
    };
    rowi42.appendChild(resetBtn);
    rowi42.appendChild($('<span>按键4</span>').get(0));
    insertRow2.appendChild((rowi42));

    // forth row
    var forthRow = document.createElement('tr');
    var row41 = document.createElement('td');
    row41.textContent = lang.targetLayer;
    forthRow.appendChild(row41);
    var row42 = document.createElement('select');
    row42.id = 'gis-qualified-target';
    row42.name = 'target';
    row42.required = 'required';
    forthRow.appendChild(row42);

    // fifth
    var fifthRow = document.createElement('tr');
    var row51 = document.createElement('td');
    var submitBtn = document.createElement('input');
    submitBtn.type = 'submit';
    submitBtn.value = lang.submit;
    row51.appendChild(submitBtn);
    fifthRow.appendChild(row51);
    var row52 = document.createElement('td');
    var cancelBtn = document.createElement('input');
    cancelBtn.type = 'button';
    cancelBtn.value = lang.cancel;
    cancelBtn.onclick = function () {
        gisGISQualityDiv.close();
    };
    row51.appendChild(cancelBtn);
    fifthRow.appendChild(row52);

    GISQualityTable.appendChild(firstRow);
    GISQualityTable.appendChild(secondRow);
    GISQualityTable.appendChild(insertRow1);
    GISQualityTable.appendChild(thirdRow);
    GISQualityTable.appendChild(insertRow2);
    GISQualityTable.appendChild(forthRow);
    GISQualityTable.appendChild(fifthRow);
    GISQualityForm.appendChild(GISQualityTable);
    gisGISQualityDiv.getContent().appendChild(GISQualityForm);
    return gisGISQualityDiv;
};

/**
 * Reset features
 *
 * @param {ol.feature[]} features Features
 */
iS3.toolbar.GisQualityControl.resetFeatures = function (features) {
    var toolbar = iS3Project.getToolbar();

    function selectableStyle() {
        return function () {
            return toolbar.selectInteraction.getFeatures().getArray().indexOf(this) === -1
                ? iS3.style.getDefault() : iS3.style.getDefaultSelected();
        };
    }

    features.forEach(function (feature) {
        feature.set('status', 0);
        feature.setStyle(selectableStyle());
    });
    toolbar.selectInteraction.getFeatures().clear();
};

/**
 * Mark feature
 *
 * @param {ol.feature[]} features Features
 * @param {string} status Status
 * @param {color} color Color
 * @param {boolean} nomark If change the status
 * @return {boolean} Success
 */
iS3.toolbar.GisQualityControl.markFeatures = function (features, status, color, nomark) {
    var toolbar = iS3Project.getToolbar();
    var fill = iS3.style.getFill(color);
    var stroke = iS3.style.getStroke(iS3.style.setTransparent(color, 0.4), 8);
    var image = null;
    switch (status) {
        case 1:
            image = iS3.style.getTriangle(fill, stroke, 8);
            break;
        case 2:
            image = iS3.style.getSquare(fill, stroke, 5);
            break;
        case 3:
            image = iS3.style.getStar(fill, stroke, 5);
            break;
        case 4:
            image = iS3.style.getHexagon(fill, stroke, 5);
            break;
        default:
            return false;
    }
    if (nomark) {
        image = iS3.style.getCircle(fill, stroke, 5);
    }
    var style = new ol.style.Style({image: image});

    function selectableStyle() {
        return function () {
            return toolbar.selectInteraction.getFeatures().getArray().indexOf(this) === -1
                ? style : iS3.style.getDefaultSelected();
        };
    }

    features.forEach(function (feature) {
        if (!nomark) {
            feature.set('status', status);
        }
        feature.setStyle(selectableStyle());
    });
    toolbar.selectInteraction.getFeatures().clear();
};

/**
 * Submit selected layer to target layer
 *
 * @param {ol.layer} selectedLayer Selected layer
 * @param {iS3.LayerDef} targetLayer Target layer
 */
iS3.toolbar.GisQualityControl.mergePoints = function (selectedLayer, targetLayer) {

    var features = selectedLayer.getSource().getFeatures();
    var sourceFormat = new iS3.format.PanotimeB();
    var json = sourceFormat.toJson(features);

    var layerDef = iS3Project.getLayertree().getLayerDefById(selectedLayer.get('id'));

    var proxy = iS3Project.getConfig().proxy;

    $.post(proxy + '/gischeck/task/submit', {
        cardayID: layerDef.name.split(':')[1],
        json: json
    }).done(function (data) {
        alert(data + '  成功提交' + layerDef.name.split(':')[1]);
        var layer = iS3Project.getLayertree().getLayerById(targetLayer.id);
        if (layer instanceof ol.layer.Tile) {
            var source = layer.getSource();
            var params = source.getParams();
            params.t = new Date().getMilliseconds();
            source.updateParams(params);
        }
    });
};

/**
 * Mark picture deleted points
 *
 * @param {file} file File
 * @param {string} status Status
 * @param {color} color Color
 */
iS3.toolbar.GisQualityControl.autoMarkPicturedPoints = function (file, status, color) {
    var fr = new FileReader();
    var features = iS3Project.getLayertree().getLayerById(
        iS3Project.getLayertree().selectedLayer.id).getSource().getFeatures();
    fr.readAsText(file);
    fr.onload = function (evt) {
        var pattern = /'(.*?)'/g;
        var ids = [];
        var m;
        while (m = pattern.exec(evt.target.result)) {
            ids.push(m[1]);
        }
        var pictureFeatures = [];
        for (var i = 0; i < features.length; i++) {
            for (var j = 0; j < ids.length; j++) {
                if (features[i].get('kydateid') === ids[j]) {
                    pictureFeatures.push(features[i]);
                    break;
                }
            }
        }
        iS3.toolbar.GisQualityControl.markFeatures(pictureFeatures, status, color);
    };
};

/**
 * Mark isolated deleted points
 *
 * @param {string} status Status
 * @param {color} color Color
 */
iS3.toolbar.GisQualityControl.autoMarkIsolatedPoints = function (status, color) {
    var buffer = iS3.topology.trueDist2MapDist(200);
    var layertree = iS3Project.getLayertree();
    if (layertree.getLayerDefById(layertree.selectedLayer.id).layertype !== iS3.LayerDef.layerType.PANOTIMEB) {
        return;
    }
    var minarea = 3.14 * buffer * buffer * 2.0;
    var features = layertree.getLayerById(layertree.selectedLayer.id).getSource().getFeatures();
    var jstsgeom = [];
    var isolatedgeom = [];
    for (var i = 0; i < features.length; i++) {
        jstsgeom.push(iS3.topology.parser.read(features[i].getGeometry()).buffer(buffer));
    }

    // CascadedPolygonUnion.union costs much time
    var polyunion = jsts.operation.union.CascadedPolygonUnion.union(jstsgeom);
    if (polyunion instanceof jsts.geom.MultiPolygon) {
        for (i = 0; i < polyunion.geometries.length; i++) {
            if (polyunion.geometries[i].getArea() < minarea) {
                isolatedgeom.push(polyunion.geometries[i]);
            }
        }
        var isolatedFeatures = [];
        for (i = 0; i < isolatedgeom.length; i++) {
            var tempfeatures = [];
            for (var j = 0; j < features.length; j++) {
                if (isolatedgeom[i].intersects(jstsgeom[j]) === true) {
                    tempfeatures.push(features[j]);
                }
            }
            if (tempfeatures.length < 4) {
                tempfeatures.forEach(function (feature) {
                    isolatedFeatures.push(feature);
                });
            }
        }

        iS3.toolbar.GisQualityControl.markFeatures(isolatedFeatures, status, color);
    }
};

/**
 * Mark repeated points
 *
 * @param {iS3.LayerDef} targetLayer The target layer definition
 * @param {string} status Status
 * @param {color} color Color
 */
iS3.toolbar.GisQualityControl.autoMarkRepeatedPoints = function (targetLayer, status, color) {
    var buffer = iS3.topology.trueDist2MapDist(5);
    var layertree = iS3Project.getLayertree();
    if (layertree.getLayerDefById(layertree.selectedLayer.id).layertype !== iS3.LayerDef.layerType.PANOTIMEB) {
        document.getElementById('auto-repeated-mark').disabled = false;
        return;
    }
    var layer = layertree.getLayerById(layertree.selectedLayer.id);
    var features = layer.getSource().getFeatures();
    var points = [];

    // Get concave hull of the features
    for (var i = 0; i < features.length; i++) {
        if (features[i].get('status') === 0) {
            points.push(features[i].getGeometry().getCoordinates());
        }
    }
    var concavePoints = hull(points, 10);
    var concaveGeom = new ol.geom.Polygon([concavePoints], 'XY');

    concaveGeom = iS3.topology.parser.write(iS3.topology.parser.read(concaveGeom).buffer(10));

    iS3.geoRequest.polygonFeaturesFromTile(targetLayer, concaveGeom).done(function (queryFeatures) {
        if (queryFeatures.length < 1) {
            document.getElementById('auto-repeated-mark').disabled = false;
            return;
        }

        var grids = {};
        for (var i = 0; i < queryFeatures.length; i++) {
            var code = iS3.geohash.encode(queryFeatures[i].get('xxx'), queryFeatures[i].get('yyy'), 9);
            if (!grids[code]) {
                grids[code] = [];
            }
            grids[code].push(queryFeatures[i]);
        }
        var repeatedFeatures = [];
        for (i = 0; i < features.length; i++) {
            var featureHash = iS3.geohash.encode(features[i].get('xxx'), features[i].get('yyy'), 9);
            var neighbors = iS3.geohash.neighbors(featureHash);
            neighbors.unshift(featureHash);
            var bufferfeature = iS3.topology.parser.read(features[i].getGeometry()).buffer(buffer);
            var intersect = false;
            for (var j = 0; j < neighbors.length; j++) {
                if (grids[neighbors[j]]) {
                    for (var k = 0; k < grids[neighbors[j]].length; k++) {
                        if (bufferfeature.intersects(iS3.topology.parser.read(grids[neighbors[j]][k].getGeometry()))) {
                            intersect = true;
                            break;
                        }
                    }
                }
                if (intersect) {
                    break;
                }
            }
            if (intersect) {
                repeatedFeatures.push(features[i]);
            }
        }
        iS3.toolbar.GisQualityControl.markFeatures(repeatedFeatures, status, color, true);
        document.getElementById('auto-repeated-mark').disabled = false;
    });
};
