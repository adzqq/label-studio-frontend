import { Typography } from 'antd';
import { observer, inject } from 'mobx-react';
import { FC, useEffect, useMemo, useRef } from 'react';
import { Tag } from '../../../common/Tag/Tag';
import { PER_REGION_MODES } from '../../../mixins/PerRegionModes';
import { Block, Elem, useBEM } from '../../../utils/bem';
import { getUrlParams } from '../../../utils/urlParams';
import { RegionEditor } from './RegionEditor';
import './RegionDetails.styl';
import { Cascader,Select } from 'antd';


const { Text } = Typography;

const RegionLabels: FC<{ result: any }> = ({ result }) => {
    const labels: any[] = result.selectedLabels || []; // ensure labels is not underfined
    const showLabels = labels.length > 1;

    return (
        <Elem name="item" key={result.pid}>
            {showLabels && (
                <Elem name="content">
                    {labels.map(label => {
                        const bgColor = label.background || '#000000';

                        return (
                            <Tag key={label.id} color={bgColor} solid>
                                {label.value}
                            </Tag>
                        );
                    })}
                </Elem>
            )}

            {result.area.text ? (
                <Elem
                    name="content"
                    mod={{ type: 'text' }}
                    dangerouslySetInnerHTML={{
                        __html: result.area.text.replace(/\\n/g, '\n'),
                    }}
                />
            ) : null}
        </Elem>
    );
};

const TextResult: FC<{ mainValue: string[] }> = observer(({ mainValue }) => {
    return (
        <Text mark>
            {mainValue.map((value: string, i: number) => (
                <p key={`${value}-${i}`} data-counter={i + 1}>{value}</p>
            ))}
        </Text>
    );
});

const ChoicesResult: FC<{ mainValue: string[] }> = observer(({ mainValue }) => {
    return (
        <Text mark>
            {mainValue.join(', ')}
        </Text>
    );
});

const RatingResult: FC<{ mainValue: string[] }> = observer(({ mainValue }) => {
    return (
        <span>
            {mainValue}
        </span>
    );
});

const ResultItem: FC<{ result: any }> = observer(({ result }) => {
    const { type, from_name, mainValue } = result;
    const isRegionList = from_name.displaMode === PER_REGION_MODES.REGION_LIST;

    const content = useMemo(() => {
        if (type.endsWith('labels')) {
            return (
                <RegionLabels result={result} />
            );
        } else if (type === 'rating') {
            return (
                <Elem name="result">
                    <Text>Rating: </Text>
                    <Elem name="value">
                        <RatingResult mainValue={mainValue} />
                    </Elem>
                </Elem>
            );
        } else if (type === 'textarea' && !(from_name.perregion && isRegionList)) {
            return (
                <Elem name="result">
                    <Text>Text: </Text>
                    <Elem name="value">
                        <TextResult mainValue={mainValue} />
                    </Elem>
                </Elem>
            );
        } else if (type === 'choices') {
            return (
                <Elem name="result">
                    <Text>Choices: </Text>
                    <Elem name="value">
                        <ChoicesResult mainValue={mainValue} />
                    </Elem>
                </Elem>
            );
        }
    }, [type, from_name, mainValue]);

    return content ? (
        <Block name="region-meta">
            {content}
        </Block>
    ) : null;
});



//标签内容分类
 const DynamicLabelContent = inject('store')(
    observer(({ store,region }) => {
        const onSelectLabelContent = (value, originNumber) => {
            let tempData = {
                [originNumber]:value
            }
            region.setLabelContent(JSON.stringify(tempData));
          };
          console.log(region);

          /* 获取分类信息数据 */
        const getClassificationData = number => {
            if (region.labelContent) {
              return JSON.parse(region.labelContent)[number] || [];
            } else return [];
        };

        const  {isView} = getUrlParams();

        const constructLabelTree = (labelInfos:any) => {
            /* 找到当前选择的标签 */
            const labelOptions = labelInfos.totalLabels;
            const curLabelData = labelOptions.find(
                (e:any) => e.title === (region.labels.length>0?region.labels[0]:"")
            );
            const noAssociateArr:any = [];
            if (curLabelData) {
                const labelContentOptions = curLabelData.labelClassifications;
                // 将关联分类信息和非关联分类信息分开
                labelContentOptions.forEach((item:any) => {
                    if (!item.association) {
                        noAssociateArr.push(item);
                    }
                });
                /* 找到当前的标签的森林 */
                const bigForest = labelInfos.labelTrees; // 所有标签的森林
                const littleForest = bigForest.children.find(
                    (e:any)  => e.title === (region.labels.length>0?region.labels[0]:"")
                ); // 当前标签的小森林
                let curTreeObj:any = {};
                // 处理成森林对象 每个属性代表一棵树 {a: [], b: []}
                if (littleForest && littleForest.children) {
                    const cascaderOptions = littleForest.children;
                    cascaderOptions.forEach((item:any) => {
                        curTreeObj[item.number] = item.children;
                    });
                }
                return  {
                    labelTreeObj: curTreeObj,
                    noAssociateOptions: noAssociateArr,
                }
            }
            return  '';
        }

        if(store.labelInfos){
            let labelInfos = JSON.parse(store.labelInfos);
            if(labelInfos){
                let result = constructLabelTree(labelInfos);
                return (<>{result.noAssociateOptions&&result.noAssociateOptions.length > 0 &&
                    result.noAssociateOptions.map((item, index) => {
                      return (
                        <>
                        <div  style={{margin:"10px"}} key={index}>
                          <span className="title">{item.name}：</span>
                          <Cascader
                            key={index}
                            style={{ width: '140px' }}
                            fieldNames={{
                              label: 'name',
                              value: 'id',
                            }}
                            disabled={isView}
                            options={result.labelTreeObj[item.number]}
                            placeholder="请选择"
                            onChange={v => onSelectLabelContent(v, item.number)}
                            value={getClassificationData(item.number)}
                          ></Cascader>
                        </div>
                        </>
                      );
                    })}</>)
            }
        }
        return <></>
    }),
);


//病灶编号
const DynamicLesionNumber= inject('store')(
    observer(({ store,region }) => {
        const handleChange = (value:any) => {
            region.setLesionNumber(value);
          };
        const getLesionOptions = () => {
            let result = localStorage.getItem('lesion-options');
            return result ? JSON.parse(result) : [];
          };

        const  {isView} = getUrlParams();

        return <div style={{margin:"10px"}}>
            <span className="title">病灶编号：</span>
            <Select
                defaultValue={
                    region.lesionNumber
                    ? region.lesionNumber
                    : '0'
                }
                disabled={isView}
                options={getLesionOptions()}
                onChange={handleChange}
            ></Select>
        </div> 
    }),
);



export const RegionDetailsMain: FC<{ region: any }> = inject('store')(observer(({ store,
    region
}) => {

    return (
        <>
            <Elem name="result">
                {(region?.results as any[]).map((res) => <ResultItem key={res.pid} result={res} />)}
            </Elem>
            <RegionEditor region={region} />
            <DynamicLabelContent   store={store} region={region}></DynamicLabelContent>
            <DynamicLesionNumber store={store} region={region}></DynamicLesionNumber>
        </>
    );
}));

type RegionDetailsMetaProps = {
    region: any,
    editMode?: boolean,
    cancelEditMode?: () => void,
    enterEditMode?: () => void,
}

export const RegionDetailsMeta: FC<RegionDetailsMetaProps> = observer(({
    region,
    editMode,
    cancelEditMode,
    enterEditMode,
}) => {
    const bem = useBEM();
    const input = useRef<HTMLTextAreaElement | null>();

    const saveMeta = (value: string) => {
        region.setMetaInfo(value);
        region.setNormInput(value);
    };

    useEffect(() => {
        if (editMode && input.current) {
            const { current } = input;

            current.focus();
            current.setSelectionRange(current.value.length, current.value.length);
        }
    }, [editMode]);

    const  {isView} = getUrlParams();

    return (
        <>
            {editMode&&!isView ? (
                <textarea
                    ref={el => input.current = el}
                    placeholder="Meta"
                    className={bem.elem('meta-text').toClassName()}
                    value={region.normInput}
                    onChange={(e) => saveMeta(e.target.value)}
                    onBlur={() => {
                        saveMeta(region.normInput);
                        cancelEditMode?.();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveMeta(region.normInput);
                            cancelEditMode?.();
                        }
                    }}
                />
            ) : region.meta?.text && (
                <Elem name="meta-text"
                    onClick={() => enterEditMode?.()}
                >
                    {region.meta?.text}
                </Elem>
            )}
            {/* <Elem name="section">
        <Elem name="section-head">
          Data Display
        </Elem>
        <Elem name="section-content">
          content
        </Elem>
      </Elem> */}
        </>
    );
    // return (
    //   <>
    //     {region?.meta?.text && (
    //       <Elem name="text">
    //           Meta: <span>{region.meta.text}</span>
    //           &nbsp;
    //         <IconTrash
    //           type="delete"
    //           style={{ cursor: "pointer" }}
    //           onClick={() => {
    //             region.deleteMetaInfo();
    //           }}
    //         />
    //       </Elem>
    //     )}
    //   </>
    // );
});
