import SkeletonLoader from './SkeletonLoader'

export default function LoadingState() {
  return (
    <>
      <p className="visually-hidden" role="status">
        Loading patient data…
      </p>
      <SkeletonLoader className="skeleton--sidebar" />
      <SkeletonLoader className="skeleton--main" />
      <SkeletonLoader className="skeleton--aside" />
    </>
  )
}
