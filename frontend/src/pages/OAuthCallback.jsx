import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function OAuthCallback() {
  const { login, API_BASE_URL } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')
    if (token) {
      // Fetch the user details via token before triggering state change
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            login(data.user, token)
            navigate('/')
          } else {
            navigate('/login')
          }
        })
        .catch(() => {
          navigate('/login')
        })
    } else {
      navigate('/login')
    }
  }, [searchParams, login, navigate, API_BASE_URL])

  return (
    <div className="auth-container">
      <div className="quantum-loader-container">
        <div className="quantum-spinner"></div>
        <div className="quantum-loader-text">Completing Secure Login...</div>
      </div>
    </div>
  )
}
