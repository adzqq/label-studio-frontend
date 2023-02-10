import chroma from 'chroma-js';
import React, { useMemo } from 'react';
import { Block, Elem } from '../../utils/bem';
import { asVars } from '../../utils/styles';

import './Label.styl';

export const Label = React.forwardRef(
    (
        {
            className,
            style,
            color,
            empty = false,
            hidden = false,
            selected = false,
            margins = false,
            onClick,
            children,
            hotkey,
            ...rest
        },
        ref,
    ) => {
        const styles = useMemo(() => {
            if (!color) return null;
            const background = chroma(color).alpha(0.15);

            return {
                ...(style ?? {}),
                ...asVars({
                    color,
                    background,
                }),
            };
        }, [color]);
        //selected 表示 默认标签是否选中，标签被选中时不可取消选中
        return (
            <Block
                tag="span"
                ref={ref}
                name="label"
                mod={{ empty, hidden, selected, clickable: !!onClick, margins }}
                mix={className}
                style={styles}
                onClick={!selected ? onClick : ''}
                {...rest}
            >
                <Elem tag="span" name="text">
                    {children}
                </Elem>
                {/* {hotkey ? (
                    <Elem tag="span" name="hotkey">
                        {hotkey}
                    </Elem>
                ) : null} */}
            </Block>
        );
    },
);
