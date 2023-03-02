import Tree from '../../core/Tree';
import { isAlive } from 'mobx-state-tree';
import { useLayoutEffect } from 'react';

export function Annotation({ annotation, root }) {
  useLayoutEffect(() => {
    return () => {
      if (annotation && isAlive(annotation)) {
        annotation.resetReady();
      }
    };
  }, [annotation.pk, annotation.id]);
  console.log('Annotation', annotation);
  return root ? Tree.renderItem(root, annotation) : null;
}
