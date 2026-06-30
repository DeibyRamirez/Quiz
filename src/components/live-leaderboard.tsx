"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Zap } from "lucide-react"
import { useState, useEffect } from "react"

interface Student {
  id: string
  name: string
  score: number
  streak: number
  correctAnswers: number
  totalAnswers: number
  averageTime: number
  position: number
  previousPosition?: number
}

interface LiveLeaderboardProps {
  students: Student[]
  isLive?: boolean
}

export function LiveLeaderboard({ students, isLive = false }: LiveLeaderboardProps) {
  const [animatedStudents, setAnimatedStudents] = useState(students)

  useEffect(() => {
    if (isLive) {
      // Simulate real-time updates
      const interval = setInterval(() => {
        setAnimatedStudents((prev) =>
          prev.map((student) => ({
            ...student,
            // Randomly update scores for demo
            score: student.score + (Math.random() > 0.8 ? 100 : 0),
          })),
        )
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [isLive])

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center font-bold">
            {position}
          </div>
        )
    }
  }

  const getPositionChange = (student: Student) => {
    if (!student.previousPosition) return null
    const change = student.previousPosition - student.position
    if (change > 0) {
      return (
        <Badge variant="default" className="text-xs bg-green-100 text-green-800">
          ↑{change}
        </Badge>
      )
    } else if (change < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          ↓{Math.abs(change)}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs">
        -
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Leaderboard en Vivo
          {isLive && (
            <Badge variant="default" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Clasificación en tiempo real</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {animatedStudents
            .sort((a, b) => b.score - a.score)
            .map((student, index) => {
              const position = index + 1
              const accuracy = student.totalAnswers > 0 ? (student.correctAnswers / student.totalAnswers) * 100 : 0

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-500 ${
                    position <= 3 ? "bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getPositionIcon(position)}
                    {getPositionChange({ ...student, position })}
                  </div>

                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {student.name.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{student.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {student.score} pts
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Precisión: {Math.round(accuracy)}%</span>
                      </div>
                      {student.streak > 1 && (
                        <div className="flex items-center gap-1 text-xs">
                          <Zap className="h-3 w-3 text-orange-500" />
                          <span className="text-orange-600 font-medium">{student.streak}x racha</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">Tiempo: {student.averageTime}s</div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {isLive && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">
              Actualizándose automáticamente • Última actualización: hace {Math.floor(Math.random() * 10) + 1}s
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
