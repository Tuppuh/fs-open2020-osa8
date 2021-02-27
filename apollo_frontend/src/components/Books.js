import React, { useState, useEffect } from 'react'
import { ALL_BOOKS, ALL_GENRES } from '../queries'
import { useQuery, useLazyQuery } from '@apollo/client'

const Books = (props) => {

  const [genre, setGenre] = useState(null)
  console.log('genre: ', genre)

  const genreResult = useQuery(ALL_GENRES)
  const [getBooks, result] = useLazyQuery(ALL_BOOKS)

  const showBooks = () => {
    getBooks({ variables: { genre: genre } })
  }

  useEffect(() => {
    showBooks()
  }, [genre]) // eslint-disable-line

  if (genreResult.loading)  {
    return <div>loading...</div>
  }

  if (!props.show) {
    return null
  }

  const books = result.data ? result.data.allBooks : []
  console.log('books to render: ', books)
  const genres = genreResult.data.allGenres
  console.log('genres:', genres)

  return (
    <div>
      <h2>books</h2>

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
      {genres.map(g => <button key={g} onClick={() => setGenre(g)}>{g}</button>)}
      <button onClick={() => setGenre(null)}>all genres</button>
    </div>
  )
}

export default Books