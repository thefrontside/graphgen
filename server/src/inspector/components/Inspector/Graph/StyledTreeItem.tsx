import { alpha, styled, darken } from '@mui/material/styles';
import TreeItem, { TreeItemProps, treeItemClasses } from "@mui/lab/TreeItem";

export const StyledTreeItem = styled((props: TreeItemProps) => (
  <TreeItem {...props} />
))(({ theme }) => ({
  [`& .${treeItemClasses.iconContainer}`]: {
    '& .close': {
      opacity: 0.3,
    },
  },
  [`& .${treeItemClasses.group}`]: {
    marginLeft: `15px !important`,
    paddingLeft: `18px !important`,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  [`& .${treeItemClasses.selected}`]: {
    backgroundColor: `${theme.palette.grey['300']} !important`
  }
}));