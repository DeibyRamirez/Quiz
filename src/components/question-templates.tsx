"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuestionTemplate {
  id: string
  title: string
  category: string
  difficulty: "facil" | "medio" | "dificil"
  type: "multiple-choice" | "numerical" | "formula"
  question: string
  answers?: string[]
  correctAnswer?: string | number
}

const questionTemplates: QuestionTemplate[] = [
  {
    id: "1",
    title: "Ley de Coulomb - Fuerza entre cargas",
    category: "Ley de Coulomb",
    difficulty: "facil",
    type: "multiple-choice",
    question: "¿Cuál es la fórmula correcta de la Ley de Coulomb?",
    answers: ["F = k * q₁ * q₂ / r²", "F = k * q₁ * q₂ * r²", "F = q₁ * q₂ / k * r²", "F = k / (q₁ * q₂ * r²)"],
    correctAnswer: "F = k * q₁ * q₂ / r²",
  },
  {
    id: "2",
    title: "Constante de Coulomb",
    category: "Ley de Coulomb",
    difficulty: "medio",
    type: "numerical",
    question: "¿Cuál es el valor de la constante de Coulomb k en el vacío? (en N⋅m²/C²)",
    correctAnswer: 8.99e9,
  },
  {
    id: "3",
    title: "Campo Eléctrico - Definición",
    category: "Campo Eléctrico",
    difficulty: "facil",
    type: "multiple-choice",
    question: "El campo eléctrico se define como:",
    answers: [
      "La fuerza por unidad de carga",
      "La carga por unidad de fuerza",
      "La energía por unidad de carga",
      "La distancia por unidad de carga",
    ],
    correctAnswer: "La fuerza por unidad de carga",
  },
  {
    id: "4",
    title: "Potencial Eléctrico - Fórmula",
    category: "Potencial Eléctrico",
    difficulty: "medio",
    type: "formula",
    question: "Escribe la fórmula del potencial eléctrico debido a una carga puntual:",
    correctAnswer: "V = k * q / r",
  },
]

interface QuestionTemplatesProps {
  onSelectTemplate: (template: QuestionTemplate) => void
}

export function QuestionTemplates({ onSelectTemplate }: QuestionTemplatesProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "facil":
        return "bg-green-100 text-green-800"
      case "medio":
        return "bg-yellow-100 text-yellow-800"
      case "dificil":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "multiple-choice":
        return "Opción Múltiple"
      case "numerical":
        return "Numérica"
      case "formula":
        return "Fórmula"
      default:
        return type
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Plantillas de Preguntas</h3>
        <p className="text-sm text-muted-foreground">Selecciona una plantilla para comenzar rápidamente</p>
      </div>

      <div className="grid gap-4">
        {questionTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{template.title}</CardTitle>
                  <CardDescription className="text-sm">{template.category}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                    {template.difficulty}
                  </Badge>
                  <Badge variant="secondary">{getTypeLabel(template.type)}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.question}</p>
              <Button size="sm" onClick={() => onSelectTemplate(template)} className="w-full">
                Usar Plantilla
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
