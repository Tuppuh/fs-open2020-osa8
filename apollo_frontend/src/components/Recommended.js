import React from 'react'
import { RECOMMENDED_BOOKS, ME } from '../queries'
import { useQuery } from '@apollo/client'

const Recommended = (props) => {
  const result = useQuery(RECOMMENDED_BOOKS)
  const meResult = useQuery(ME)

  //const result = useQuery(ALL_BOOKS, { variables: { genre: genre } })


  if (result.loading || meResult.loading)  {
    return <div>loading...</div>
  }

  console.log('result: ', result)

  if (!props.show) {
    return null
  }

  const books = result.data.recommendedBooks
  console.log('books: ', books)
  const me = meResult.data.me
  console.log('me: ', me)

  if (!me) {
      return <div>please log in</div>
  }

  const genre = me.favoriteGenre

  return (
    <div>
      <h2>recommendations</h2>
      <div>books in your favorite genre {genre}</div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Recommended