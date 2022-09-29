import { alpha, styled } from "@mui/material/styles";
import TreeItem, { treeItemClasses, TreeItemProps } from "@mui/lab/TreeItem";
import { FC } from 'react';

export const StyledTreeItem: FC<TreeItemProps> = styled((props: TreeItemProps) => (
  <TreeItem {...props} />
))(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    "& .close": {
      opacity: 0.3,
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: `15px !important`,
    paddingLeft: `18px !important`,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  [`& .${treeItemClasses.selected}`]: {
    backgroundColor: `${theme.palette.grey["300"]} !important`,
  },
}));
