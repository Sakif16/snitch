import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/university/$tag')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      search bar here
    </div>
  )
}
