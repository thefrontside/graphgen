import { DefaultNodeProps } from "react-hyper-tree";

type ArrowProps = {
  onClick?: (e: React.MouseEvent<HTMLOrSVGElement>) => void
  opened?: boolean
}

// deno-lint-ignore no-explicit-any
export const isFunction = (func: any) => func && {}.toString.call(func) === '[object Function]'

export const Loader = () => (
  <div className="loading-spinner">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 48 48">
          <g fill="none">
              <path
                  id="track"
                  fill="#C6CCD2"
                  d="M24,48 C10.745166,48 0,37.254834 0,24 C0,10.745166 10.745166,0 24,0
      C37.254834,0 48,10.745166 48,24 C48,37.254834 37.254834,48 24,48 Z M24,44
      C35.045695,44 44,35.045695 44,24 C44,12.954305 35.045695,4 24,4
      C12.954305,4 4,12.954305 4,24 C4,35.045695 12.954305,44 24,44 Z"
              />
              <path
                  id="section"
                  fill="#3F4850"
                  d="M24,0 C37.254834,0 48,10.745166 48,24 L44,24 C44,12.954305 35.045695,4 24,4 L24,0 Z"
              />
          </g>
      </svg>
  </div>
)

export const Arrow: React.FC<ArrowProps> = ({ onClick, opened }) => (
  <svg
      className={`ht_hyperNodeArrowIcon${opened ? ' ht_opened' : ''} `}
      xmlns="http://www.w3.org/2000/svg"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      onClick={onClick}
  >
      <path d="M5 3l3.057-3 11.943 12-11.943 12-3.057-3 9-9z" />
  </svg>
);

export const DefaultNode: React.FC<DefaultNodeProps> = ({
  // deno-lint-ignore no-explicit-any
  displayedName = (node: any) => node.data.name,
  node,
  onSelect,
  onToggle
}) => (
  <div className="ht_hyperNode" onClick={onSelect}>
      {(node.hasChildren() || node.options.async) && !node.isLoading() && (
          // deno-lint-ignore no-explicit-any
          <Arrow onClick={onToggle as any} opened={node.isOpened() && !!node.hasChildren()} />
      )}
      {node.isLoading() && <Loader />}

      <div>{isFunction(displayedName) ? (displayedName as any)(node) : node.data[displayedName as any]}</div>
  </div>
)
