import { getEnv, getParent, getRoot, getType, types } from 'mobx-state-tree';
import { guidGenerator } from '../core/Helpers';
import { AnnotationMixin } from './AnnotationMixin';

const RegionsMixin = types
    .model({
        // id: types.optional(types.identifier, guidGenerator),
        pid: types.optional(types.string, guidGenerator),

        score: types.maybeNull(types.number),
        readonly: types.optional(types.boolean, false),

        hidden: types.optional(types.boolean, false),

        parentID: types.optional(types.string, ''),

        fromSuggestion: false,

        // Dynamic preannotations enabled
        dynamic: false,

        locked: false,

        origin: types.optional(types.enumeration(['prediction', 'prediction-changed', 'manual']), 'manual'),

        //标签内容
        labelContent: types.maybeNull(types.string),

        //病灶编号
        lesionNumber: types.maybeNull(types.string),

        //图片dpi
        dpi: types.optional(types.number, 762),

        //面积
        calcArea: types.optional(types.number, 0),

        //长径
        longDiameter: types.optional(types.number, 0),

        //短径
        shortDiameter: types.optional(types.number, 0),

    })
    .volatile(() => ({
        // selected: false,
        _highlighted: false,
        isDrawing: false,
        perRegionFocusRequest: null,
        shapeRef: null,
        drawingTimeout: null,
    }))
    .views(self => ({
        get perRegionStates() {
            const states = self.states;

            return states && states.filter(s => s.perregion === true);
        },

        get store() {
            return getRoot(self);
        },

        get parent() {
            return getParent(self);
        },

        get editable() {
            if (self.locked === true) return false;

            return self.readonly === false && self.annotation.editable === true;
        },

        get isCompleted() {
            return !self.isDrawing;
        },

        get highlighted() {
            return self._highlighted;
        },

        get inSelection() {
            return self.annotation?.regionStore.isSelected(self);
        },

        get isReady() {
            return true;
        },

        getConnectedDynamicRegions(selfExcluding) {
            const { regions = [] } = getRoot(self).annotationStore?.selected || {};

            return regions.filter(r => {
                if (selfExcluding && r === self) return false;
                return r.dynamic && r.type === self.type && r.labelName === self.labelName;
            });
        },
    }))
    .actions(self => {
        return {
            setLabelContent(value) {
                self.labelContent = value;
            },
            setLesionNumber(value) {
                self.lesionNumber = value;
            },
            setCalcArea(value) {
                self.calcArea = value
            },
            setLongDiameter(value) {
                self.longDiameter = value
            },
            setShortDiameter(value) {
                self.shortDiameter = value
            },
            setParentID(id) {
                self.parentID = id;
            },

            setDrawing(val) {
                self.isDrawing = val;
            },

            setShapeRef(ref) {
                self.shapeRef = ref;
            },

            beforeDestroy() {
                self.notifyDrawingFinished({ destroy: true });
            },

            setLocked(locked) {
                if (locked instanceof Function) {
                    self.locked = locked(self.locked);
                } else {
                    self.locked = locked;
                }
            },

            makeDynamic() {
                self.dynamic = true;
            },

            // All of the below accept size as an argument
            moveTop() { },
            moveBottom() { },
            moveLeft() { },
            moveRight() { },

            sizeRight() { },
            sizeLeft() { },
            sizeTop() { },
            sizeBottom() { },

            // "web" degree is opposite to mathematical, -90 is 90 actually
            // swapSizes = true when canvas is already rotated at this moment
            // @todo not used
            rotatePoint(point, degree, swapSizes = true) {
                const { x, y } = point;

                if (!degree) return { x, y };

                degree = (360 + degree) % 360;
                // transform origin is (w/2, w/2) for ccw rotation
                // (h/2, h/2) for cw rotation
                const w = self.parent.stageWidth;
                const h = self.parent.stageHeight;
                // actions: translate to fit origin, rotate, translate back
                //   const shift = size / 2;
                //   const newX = (x - shift) * cos + (y - shift) * sin + shift;
                //   const newY = -(x - shift) * sin + (y - shift) * cos + shift;
                // for ortogonal degrees it's simple:

                if (degree === 270) return { x: y, y: (swapSizes ? h : w) - x };
                if (degree === 90) return { x: (swapSizes ? w : h) - y, y: x };
                if (Math.abs(degree) === 180) return { x: w - x, y: h - y };
                return { x, y };
            },

            // @todo not used
            rotateDimensions({ width, height }, degree) {
                if ((degree + 360) % 180 === 0) return { width, height };
                return { width: height, height: width };
            },

            convertXToPerc(x) {
                return (x * 100) / self.parent.stageWidth;
            },

            convertYToPerc(y) {
                return (y * 100) / self.parent.stageHeight;
            },

            convertHDimensionToPerc(hd) {
                return (hd * (self.scaleX || 1) * 100) / self.parent.stageWidth;
            },

            convertVDimensionToPerc(vd) {
                return (vd * (self.scaleY || 1) * 100) / self.parent.stageHeight;
            },

            // update region appearence based on it's current states, for
            // example bbox needs to update its colors when you change the
            // label, becuase it takes color from the label
            updateAppearenceFromState() { },

            serialize() {
                console.error('Region class needs to implement serialize');
            },

            toStateJSON() {
                const parent = self.parent;
                const buildTree = control => {
                    const tree = {
                        id: self.pid,
                        from_name: control.name,
                        to_name: parent.name,
                        source: parent.value,
                        type: control.type,
                        parent_id: self.parentID === '' ? null : self.parentID,
                    };

                    if (self.normalization) tree['normalization'] = self.normalization;

                    return tree;
                };

                if (self.states && self.states.length) {
                    return self.states
                        .map(s => {
                            const ser = self.serialize(s, parent);

                            if (!ser) return null;

                            const tree = {
                                ...buildTree(s),
                                ...ser,
                            };

                            // in case of labels it's gonna be, labels: ["label1", "label2"]

                            return tree;
                        })
                        .filter(Boolean);
                } else {
                    const obj = self.annotation.toNames.get(parent.name);
                    const control = obj.length ? obj[0] : obj;

                    const tree = {
                        ...buildTree(control),
                        ...self.serialize(control, parent),
                    };

                    return tree;
                }
            },

            selectRegion() { },

            /**
                   * @todo fix "keep selected" setting
                   * Common logic for unselection; specific actions should be in `afterUnselectRegion`
                   * @param {boolean} tryToKeepStates try to keep states selected if such settings enabled
                   */
            unselectRegion(tryToKeepStates = false) {
                console.log('UNSELECT REGION', 'you should not be here');
                // eslint-disable-next-line no-constant-condition
                if (1) return;
                const annotation = self.annotation;
                const parent = self.parent;
                const keepStates = tryToKeepStates && self.store.settings.continuousLabeling;

                if (annotation.relationMode) {
                    annotation.stopRelationMode();
                }
                if (parent.setSelected) {
                    parent.setSelected(undefined);
                }

                self.selected = false;
                annotation.setHighlightedNode(null);

                self.afterUnselectRegion();

                if (!keepStates) {
                    annotation.unloadRegionState(self);
                }
            },

            afterUnselectRegion() { },

            onClickRegion(ev) {
                const annotation = self.annotation;

                if (self.editable && (self.isDrawing || annotation.isDrawing)) return;

                if (self.editable && annotation.relationMode) {
                    annotation.addRelation(self);
                    annotation.stopRelationMode();
                    annotation.regionStore.unselectAll();
                } else {
                    self._selectArea(ev?.ctrlKey || ev?.metaKey);
                }
            },

            _selectArea(additiveMode = false) {
                this.cancelPerRegionFocus();
                const annotation = self.annotation;

                if (additiveMode) {
                    annotation.toggleRegionSelection(self);
                } else {
                    const wasNotSelected = !self.selected;

                    if (wasNotSelected) {
                        annotation.selectArea(self);
                    } else {
                        annotation.unselectAll();
                    }
                }
            },

            requestPerRegionFocus() {
                self.perRegionFocusRequest = Date.now();
            },

            cancelPerRegionFocus() {
                self.perRegionFocusRequest = null;
            },

            setHighlight(val) {
                self._highlighted = val;
            },

            toggleHighlight() {
                self.setHighlight(!self._highlighted);
            },

            toggleHidden(e) {
                self.hidden = !self.hidden;
                e && e.stopPropagation();
            },

            notifyDrawingFinished({ destroy = false } = {}) {
                console.log('notifyDrawingFinished');
                if (self.origin === 'prediction') {
                    self.origin = 'prediction-changed';
                }


                //画完后默认选中状态,并且设置默认病灶编号
                setTimeout(() => {
                    console.log(self);
                    // self.lesionNumber = self.lesionNumber ? self.lesionNumber : (sessionStorage.getItem('defaultLesionNumber') || '0');
                    self.setCalcArea(self.calcArea + 0.01)
                    if (!self.selected) {
                        self._selectArea(false);
                    }
                }, 100);

                // everything above is related to dynamic preannotations
                if (!self.dynamic || self.fromSuggestion) return;

                clearTimeout(self.drawingTimeout);

                if (self.isDrawing === false) {
                    const timeout = getType(self).name.match(/brush/i) ? 1200 : 0;
                    const env = getEnv(self);

                    self.drawingTimeout = setTimeout(() => {
                        env.events.invoke('regionFinishedDrawing', self, self.getConnectedDynamicRegions(destroy));
                    }, timeout);

                }

            },
        };
    });

export default types.compose(RegionsMixin, AnnotationMixin);
