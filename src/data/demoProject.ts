import {
  DEFAULT_COSTA_RICA_BANKS,
  DEFAULT_LEGAL_TAX_CHECKLIST,
  DEFAULT_STARTUP_COSTS,
  EXTRA_BANK_CONSIDERATIONS,
} from './questionsAndRubric';
import { BusinessPlanState } from '../types/businessPlan';

export function createEmptyBusinessPlanState(): BusinessPlanState {
  return {
    sessionId: `cr-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    lastSavedAt: new Date().toISOString(),
    aiMemoryNotes: [],
    studentName: '',
    teamMembers: '',
    teacherName: 'Prof. Liz Acuña',
    passionText: '',
    passionAnalysis: '',
    proposals: [],
    selectedProposalId: null,
    companyName: '',
    companySlogan: '',
    answers: {},
    startupCosts: DEFAULT_STARTUP_COSTS.map((c) => ({ ...c })),
    financialAssumptions: {
      unitPriceCRC: 12000,
      unitVariableCostCRC: 5200,
      fixedMonthlyOpCostCRC: 480000,
      estimatedMonthlyUnits: 110,
      ownCapitalCRC: 650000,
    },
    banks: DEFAULT_COSTA_RICA_BANKS.map((b) => ({
      ...b,
      keyRequirements: [...b.keyRequirements],
      checkedRequirements: [],
    })),
    selectedBankId: null,
    extraBankConsiderations: [...EXTRA_BANK_CONSIDERATIONS],
    legalTaxChecklist: DEFAULT_LEGAL_TAX_CHECKLIST.map((l) => ({ ...l })),
    rubric: {
      scores: {
        1: 3,
        2: 3,
        3: 3,
        4: 3,
        5: 3,
        6: 3,
        7: 3,
        8: 3,
        9: 3,
        10: 3,
      },
      justifications: {},
      finalComment: '',
      evaluatedByAI: false,
    },
    mentorMessages: [
      {
        id: 'welcome-1',
        role: 'assistant',
        content:
          '¡Hola! Soy tu Mentor Emprendedor conectado con Gemini. Memorizo automáticamente cada avance de tu plan de negocios para que puedas cerrar la aplicación y continuar luego sin perder tu progreso. Cuéntame tu nombre, el nombre de tu empresa y qué amas hacer.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function createDemoBusinessPlanState(): BusinessPlanState {
  const base = createEmptyBusinessPlanState();

  return {
    ...base,
    sessionId: 'CR-DEMO51',
    aiMemoryNotes: [
      'Pasión definida: Repostería artesanal saludable con cacao fino costarricense sin azúcar refinada.',
      'Modelo elegido: Cacao Vivo CR — Cajas Saludables por Suscripción.',
      'Filosofía empresarial definida con 10 principios, liderazgo transformacional y clima colaborativo.',
      'Banco seleccionado tras comparar 4 entidades de CR: Banco Nacional (BNCR - BN Desarrollo al 10.5%).',
      '51/51 preguntas respondidas y Rúbrica SIG evaluada en 40/40 puntos.',
    ],
    studentName: 'Valeria Rojas Méndez',
    teamMembers: 'Valeria Rojas (Dirección & Producción), Mateo Solano (Finanzas & SIG)',
    teacherName: 'Prof. Liz Acuña',
    passionText: 'Repostería artesanal saludable con cacao fino costarricense y diseño de postres sin azúcar refinada',
    passionAnalysis:
      'Tu pasión combina el valor agregado del cacao fino de aroma costarricense con la creciente demanda de alimentación consciente en el Gran Área Metropolitana. Esto permite diferenciarse de la panadería tradicional con márgenes superiores y modelos flexibles bajo pedido.',
    proposals: [
      {
        id: 'prop-1',
        name: 'Cacao Vivo CR — Cajas Saludables por Suscripción',
        tagline: 'Repostería funcional de cacao tico entregada semanalmente bajo demanda',
        description:
          'Modelo directo al consumidor (D2C) basado en producción bajo pedido y cajas semanales saludables para profesionales, deportistas y personas que cuidan su glucosa.',
        valueProposition:
          'Postres frescos elaborados con cacao orgánico de Talamanca, cero azúcar añadida, ficha nutricional validada y entrega programada en menos de 4 horas.',
        targetAudience: 'Profesionales de 25 a 45 años en San José, Heredia y Curridabat con estilo de vida activo.',
        revenueStreams: ['Cajas semanales por suscripción', 'Pedidos personalizados corporativos', 'Talleres virtuales de repostería saludable'],
        estimatedInitialCostCRC: 1845000,
        estimatedMonthlyRevenueCRC: 1440000,
        timeToBreakevenMonths: 4,
        difficulty: 'Baja',
        keyTools: ['WhatsApp Business', 'POS + Facturación Electrónica', 'Notion Kanban', 'SINPE Móvil'],
        recommendedLegalForm: 'Persona Física con Actividad Lucrativa o S.R.L.',
      },
      {
        id: 'prop-2',
        name: 'Estación B2B de Snacks Saludables para Cafeterías',
        tagline: 'Proveedor especializado de repostería funcional para cafeterías de especialidad',
        description:
          'Producción en lotes medianos para abastecer cafeterías, gimnasios y supermercados boutique en el GAM con marca blanca o marca propia.',
        valueProposition:
          'Abastecimiento constante con etiqueta nutricional lista para exhibición, vida útil optimizada y reposición automática semanal.',
        targetAudience: 'Cafeterías de especialidad, estudios de yoga/pilates y tiendas orgánicas del GAM.',
        revenueStreams: ['Contratos mayoristas semanales', 'Exhibidores consignados'],
        estimatedInitialCostCRC: 2950000,
        estimatedMonthlyRevenueCRC: 2100000,
        timeToBreakevenMonths: 6,
        difficulty: 'Media',
        keyTools: ['ERP Inventarios', 'Facturación Electrónica Hacienda', 'CRM B2B'],
        recommendedLegalForm: 'Sociedad de Responsabilidad Limitada (S.R.L.)',
      },
      {
        id: 'prop-3',
        name: 'Academia & Kits DIY de Repostería con Cacao',
        tagline: 'Kits con ingredientes pesados + video clases guiadas para familias',
        description:
          'Comercialización de cajas con premezclas saludables de cacao costarricense acompañadas de acceso a plataforma de video recetas.',
        valueProposition:
          'Experiencia educativa en casa sin desperdicio de ingredientes ni conocimientos previos.',
        targetAudience: 'Familias jóvenes y amantes de la cocina creativa en todo Costa Rica vía Correos de Costa Rica.',
        revenueStreams: ['Venta de kits físicos', 'Membresía digital de recetas'],
        estimatedInitialCostCRC: 1520000,
        estimatedMonthlyRevenueCRC: 1050000,
        timeToBreakevenMonths: 5,
        difficulty: 'Baja',
        keyTools: ['Tienda Shopify/WooCommerce', 'Correos de CR API', 'Video Hosting'],
        recommendedLegalForm: 'Persona Física con Actividad Lucrativa',
      },
    ],
    selectedProposalId: 'prop-1',
    companyName: 'Cacao Vivo CR',
    companySlogan: 'Dulzura real con cacao costarricense, sin culpas',
    startupCosts: [
      { id: 'c1', category: 'Equipamiento', concept: 'Horno semi-industrial eléctrico, batidora planetaria y mesa inox', amountCRC: 680000, essential: true },
      { id: 'c2', category: 'Tecnología y SIG', concept: 'Sistema POS, facturación electrónica anual, dominio y tablet', amountCRC: 165000, essential: true },
      { id: 'c3', category: 'Permisos y Legal', concept: 'Permiso Sanitario Ministerio de Salud, patente municipal y póliza INS', amountCRC: 195000, essential: true },
      { id: 'c4', category: 'Inventario Inicial', concept: 'Cacao orgánico de Talamanca, harina de almendra, eritritol y empaques', amountCRC: 310000, essential: true },
      { id: 'c5', category: 'Marketing Lanzamiento', concept: 'Diseño de empaque, sesión fotográfica y pauta Meta Ads mes 1', amountCRC: 145000, essential: true },
      { id: 'c6', category: 'Capital de Trabajo', concept: 'Reserva de 3 meses para electricidad, envíos y contingencias', amountCRC: 350000, essential: true },
    ],
    financialAssumptions: {
      unitPriceCRC: 12000,
      unitVariableCostCRC: 4900,
      fixedMonthlyOpCostCRC: 490000,
      estimatedMonthlyUnits: 120,
      ownCapitalCRC: 750000,
    },
    banks: DEFAULT_COSTA_RICA_BANKS.map((bank) => {
      if (bank.id === 'bncr') {
        return {
          ...bank,
          checkedRequirements: [...bank.keyRequirements],
          studentNotes:
            'BN Desarrollo ofrece acompañamiento PyME y acepta aval del Sistema de Banca para el Desarrollo (SBD) hasta el 75%-80% sin requerir hipoteca.',
          prosAndCons: 'Ventaja: tasa competitiva (10.5%) y plazo hasta 60 meses. Reto: formalización toma 3 a 4 semanas.',
        };
      }
      if (bank.id === 'bcr') {
        return {
          ...bank,
          checkedRequirements: bank.keyRequirements.slice(0, 4),
          studentNotes:
            'BCR Impulso PyME requiere certificación de ingresos por CPA y cotizaciones formales del horno y equipo.',
          prosAndCons: 'Ventaja: buena red de sucursales. Desventaja: suele exigir fiador asalariado adicional.',
        };
      }
      if (bank.id === 'bac') {
        return {
          ...bank,
          checkedRequirements: bank.keyRequirements.slice(0, 3),
          studentNotes:
            'BAC Credomatic agiliza desembolsos si se procesan ventas con su datáfono/e-commerce, pero exige al menos 6-12 meses de historial operativo.',
          prosAndCons: 'Ventaja: plataforma digital ágil. Desventaja: tasa más alta (14.5%) y exige trayectoria previa.',
        };
      }
      return {
        ...bank,
        checkedRequirements: bank.keyRequirements.slice(0, 4),
        studentNotes:
          'Banco Popular mediante FODEMIPYME prioriza microempresas lideradas por jóvenes o mujeres con tasa del 9.8%.',
        prosAndCons: 'Ventaja: tasa más baja y enfoque social. Desventaja: montos iniciales más conservadores.',
      };
    }),
    selectedBankId: 'bncr',
    legalTaxChecklist: DEFAULT_LEGAL_TAX_CHECKLIST.map((item) => ({ ...item, completed: true })),
    answers: {
      q1: 'Amo la repostería saludable y experimentar con cacao fino costarricense para crear postres nutritivos sin azúcar refinada. Llevo tres años perfeccionando recetas para familiares con diabetes.',
      q2: 'Quiero ayudar a personas que viven con diabetes, deportistas y familias ocupadas en Costa Rica para que disfruten postres deliciosos sin dañar su salud ni sentir culpa.',
      q3: 'Mi misión en la vida como profesional en administración de empresas es crear negocios éticos, rentables y sostenibles que transformen el talento local costarricense en bienestar real y empleo digno.',
      q4: 'Quiero resolver la falta de repostería artesanal fresca, sabrosa, libre de azúcares refinados y con información nutricional transparente y confiable en el Gran Área Metropolitana.',
      q5: 'Puedo resolverlo porque combino dominio práctico de formulación saludable con formación en administración de empresas, control financiero riguroso y alianzas directas con productores de cacao en Talamanca.',
      q6: 'El vacío que veo es que las pastelerías tradicionales ofrecen productos cargados de azúcar y las pocas opciones "light" del mercado son ultraprocesadas, costosas y sin frescura artesanal.',
      q7: 'Me hará diferente la trazabilidad 100% costarricense de nuestro cacao, el respaldo de tabla nutricional validada por especialista, cero preservantes y entrega programada el mismo día.',
      q8: 'Seré el número 1 detrás de mi empresa porque nunca dejaré de escuchar al cliente: mediré la satisfacción tras cada pedido, innovaré cada mes con base en datos del SIG y cuidaré cada gramo de calidad.',
      q9: 'Haré felices a mis clientes con empaques compostables personalizados, una tarjeta con el perfil nutricional exacto, entrega puntual en menos de 4 horas y un detalle sorpresa en fechas especiales.',
      q10: 'Elegí el modelo de Cajas Saludables por Suscripción y pedidos bajo demanda (Cacao Vivo CR) porque minimiza el desperdicio de inventario perecedero y exige un capital inicial accesible.',
      q11: 'Profesionales y deportistas entre 25 y 45 años residentes en San José, Heredia y Curridabat, de nivel socioeconómico medio y medio-alto, que valoran la salud y compran por WhatsApp e Instagram.',
      q12: 'Misión: Elaborar repostería funcional fresca con cacao tico que cuide la salud sin sacrificar el sabor. Visión: Ser al 2031 la marca referente de bienestar dulce en Costa Rica. Se relaciona con mi filosofía de vivir con propósito, salud e integridad.',
      q13: 'Mi filosofía empresarial se basa en 10 principios: 1. Honestidad total en ingredientes. 2. Excelencia en cada detalle. 3. Respeto y empatía con clientes y equipo. 4. Puntualidad sagrada. 5. Sostenibilidad ambiental. 6. Aprendizaje continuo. 7. Disciplina financiera. 8. Innovación basada en datos. 9. Apoyo al productor nacional. 10. Gratitud y servicio genuino.',
      q14: 'Realizaré cuatro estudios de entorno: 1) Análisis PESTEL (inflación, normativa de Hacienda y Ministerio de Salud); 2) 5 Fuerzas de Porter (poder de proveedores de cacao y sustitutos); 3) Matriz FODA; y 4) Estudio de mercado local mediante encuesta a 60 clientes potenciales y Mystery Shopper a 5 competidores.',
      q15: 'Nombre: Cacao Vivo CR. Eslogan: "Dulzura real con cacao costarricense, sin culpas". Objetivos SMART: 1) Lograr 120 cajas/mes al mes 6; 2) Alcanzar 40% de recompra trimestral; 3) Obtener licencia Marca País Esencial Costa Rica al año 2.',
      q16: '1) Captación de pedido digital antes de las 2:00 p.m.; 2) Verificación automática de inventario en SIG; 3) Producción en lotes frescos por la mañana; 4) Control de calidad y etiquetado nutricional; 5) Despacho con mensajería refrigerada y encuesta de satisfacción.',
      q17: 'Modelo híbrido desde un taller culinario acondicionado en casa (22 m²) con zona de empaque independiente y ventas 100% digitales. Capacidad inicial instalada de 160 cajas mensuales.',
      q18: 'Valeria Rojas (Dirección General, Producción y Calidad), Mateo Solano (Gestión Comercial, Finanzas y Sistema de Información Gerencial) y un contador externo por servicios profesionales.',
      q19: 'Crearé un clima organizacional basado en la confianza, comunicación abierta y segura, reconocimiento semanal de logros, metas claras sin microgestión y respeto estricto al tiempo de descanso del equipo.',
      q20: 'Aplicaré un liderazgo transformacional y de servicio: motivar con el propósito de salud de la empresa, predicar con el ejemplo en la cocina y gestión, escuchar activamente ideas de mejora y empoderar a cada colaborador.',
      q21: 'Proveedores principales: Cooperativa de Cacao de Talamanca y Distribuidora Nutrición Natural CR (con respaldo de Mercado Central para emergencias). Control de stock mínimo semanal en módulo de inventario.',
      q22: 'Sistema de Información Gerencial integrado por tablet POS, software en la nube con Facturación Electrónica (Alegra CR), tablero de costos e inventarios en tiempo real y CRM en WhatsApp Business.',
      q23: 'Integramos cobros inmediatos vía SINPE Móvil y link de pago sin contacto, catálogo digital con QR dinámico y automatización de recordatorios de recompra mediante flujos conectados a la base de clientes.',
      q24: 'El equipo trabaja colaborativamente usando Notion (tablero Kanban de producción y pedidos), Google Workspace compartido para conciliaciones semanales y reuniones operativas de 20 minutos cada lunes.',
      q25: 'Contamos con el respaldo técnico de una Ingeniera en Alimentos para validar vida útil y tabla nutricional, y un CPA para proyecciones fiscales. Medimos semanalmente tasa de entrega a tiempo (>96%) y margen por receta.',
      q26: 'El costo aproximado para comenzar en pequeño es de ₡1,845,000: Equipamiento (₡680,000), Capital de Trabajo (₡350,000), Inventario Inicial (₡310,000), Permisos (₡195,000), Tecnología SIG (₡165,000) y Marketing (₡145,000).',
      q27: 'Aportaremos ₡750,000 de ahorros propios (40.6% de la inversión) y mantendremos ₡350,000 líquidos exclusivamente como reserva operativa para cubrir servicios y emergencias de los primeros 3 meses.',
      q28: 'Precio promedio de venta por caja: ₡12,000. Costo variable unitario (insumos, empaque y envío): ₡4,900. Margen de contribución unitario: ₡7,100 (59.2% sobre el precio de venta).',
      q29: 'Con costos fijos mensuales de ₡490,000 y un margen de contribución de ₡7,100 por caja, el punto de equilibrio exacto es de 70 cajas mensuales (menos de 18 cajas por semana).',
      q30: 'Sí incorporamos un socio estratégico complementario (Mateo Solano) con experiencia administrativa y aporte de capital, evitando socios puramente pasivos que no aporten valor operativo al inicio.',
      q31: 'Convencería a inversionistas presentando: margen bruto del 59.2%, punto de equilibrio alcanzable con solo 70 cajas/mes, recuperación estimada de la inversión en 6 meses y una lista validada de 32 primeros compradores.',
      q32: 'Ofrecería hasta un 25% de participación por un aporte de ₡600,000 mediante pacto de socios notariado, con reparto trimestral después de apartar un 15% de reserva y cláusula de salida justa.',
      q33: 'Elegimos operar inicialmente como Sociedad de Responsabilidad Limitada (S.R.L.) debido a la participación de dos socios, lo que separa el patrimonio personal del riesgo comercial y facilita contratos.',
      q34: 'Gestionaremos Uso de Suelo en la Municipalidad correspondiente, Permiso Sanitario de Funcionamiento ante el Ministerio de Salud (Categoría B para alimentos) con carné de manipulación de alimentos y Patente Comercial.',
      q35: 'Inscripción formal ante la Caja Costarricense de Seguro Social (CCSS) como patrono/trabajador independiente y adquisición obligatoria de la Póliza de Riesgos del Trabajo ante el INS antes de abrir.',
      q36: 'Inscripción en el Ministerio de Hacienda (ATV / TRIBU-CR) bajo el Régimen Tradicional con código CIIU de elaboración de productos de panadería/pastelería, emitiendo factura electrónica en cada venta.',
      q37: 'Declaración y pago mensual del IVA (13% general o tarifa aplicable según insumo) mediante formulario D-104 hasta el día 15, declaración anual de Renta D-101 con pagos parciales y patente municipal trimestral.',
      q38: 'Registro de la marca y logotipo "Cacao Vivo CR" en el Registro de Propiedad Industrial del Registro Nacional, contratos claros con proveedores y cumplimiento de Ley 8968 de protección de datos de clientes.',
      q39: 'El financiamiento total de ₡1,845,000 proviene de ₡750,000 en ahorros propios (40.6%) y ₡1,095,000 mediante crédito PyME respaldado por el Sistema de Banca para el Desarrollo (59.4%).',
      q40: 'Investigamos BNCR (BN Desarrollo, 10.5% a 60 meses), BCR (Impulso PyME, 11.2% a 48 meses), BAC Credomatic (CrediPyME, 14.5% a 36 meses) y Banco Popular (FODEMIPYME, 9.8% a 60 meses). La banca pública ofrece mejores condiciones para etapas tempranas.',
      q41: 'Si contara con todos los requisitos, elegiría al Banco Nacional (BNCR - BN Desarrollo) porque combina tasa competitiva (10.5%), plazo amplio a 60 meses que cuida la liquidez y acompañamiento PyME con aval SBD.',
      q42: 'El BNCR exige cédula/personería, historial limpio nivel 1 en SUGEF, flujo de caja proyectado certificado por CPA, facturas proforma de equipos y aval del SBD o fiador asalariado.',
      q43: 'Es indispensable contar previamente con la inscripción PyME ante el MEIC (SIEC), constancias al día de CCSS, Hacienda y FODESAF, además del Permiso Sanitario del Ministerio de Salud aprobado.',
      q44: 'Financiando ₡1,095,000 al 10.5% anual a 60 meses en el BNCR, la cuota mensual aproximada es de ₡23,536, lo cual representa apenas un 6.5% de la utilidad neta mensual proyectada al alcanzar 120 cajas.',
      q45: 'Posicionamiento cercano, honesto y costarricense: repostería saludable hecha con orgullo local, diseño limpio y comunicación transparente sobre ingredientes y beneficios nutricionales.',
      q46: 'Usaremos Instagram Reels y TikTok para mostrar recetas y trazabilidad del cacao, Google Perfil de Negocio para búsquedas locales, WhatsApp Business como canal de cierre y alianzas con 4 estudios fitness.',
      q47: 'Semana 1: campaña de expectativa y lista VIP (20% descuento); Semana 2: envío de cajas de degustación a nutricionistas y coaches; Semana 3: lanzamiento oficial con envío gratis; Semana 4: combo de suscripción mensual.',
      q48: 'Presupuesto mensual de marketing de ₡95,000 (₡60,000 en Meta Ads geolocalizado y ₡35,000 en muestras). KPIs: Costo de Adquisición (CAC) menor a ₡2,800, tasa de conversión >= 4% y ROAS > 3.5x.',
      q49: 'Programa de fidelización digital: cada 5ta caja acumula 25% de descuento en la 6ta; seguimiento automatizado a las 48 horas por WhatsApp y bono de ₡2,000 por cada amigo referido que realice su primer pedido.',
      q50: 'Ministerio de Economía, Industria y Comercio [MEIC]. (2025). Guía oficial de registro PYME en Costa Rica. https://www.meic.go.cr | Ministerio de Hacienda. (2025). Manual del contribuyente e IVA. https://www.hacienda.go.cr | Laudon, K. C., & Laudon, J. P. (2022). Sistemas de información gerencial (16.ª ed.). Pearson.',
      q51: 'Tras la retroalimentación de la Prof. Liz Acuña y del agente Gemini, ajustamos el flujo de caja para separar el IVA del ingreso neto, incorporamos la póliza del INS en los costos iniciales y detallamos los 10 principios de filosofía empresarial y liderazgo.',
    },
    rubric: {
      scores: {
        1: 4,
        2: 4,
        3: 4,
        4: 4,
        5: 4,
        6: 4,
        7: 4,
        8: 4,
        9: 4,
        10: 4,
      },
      justifications: {
        1: 'Los objetivos SMART y el modelo de suscripción están completamente alineados.',
        2: 'Incluye PESTEL, Porter, FODA y normativa costarricense vigente.',
        3: 'Detalla POS, facturación electrónica, nube y presupuesto tecnológico exacto.',
        4: 'Incluye justificación de Ingeniera en Alimentos y Contador Público Autorizado.',
        5: 'Integra SINPE Móvil, WhatsApp Business, QR y automatización acorde al mercado.',
        6: 'Roles claros entre socios, clima organizacional, liderazgo y Notion.',
        7: 'Uso sólido de simuladores financieros, gráficos y herramientas SIG.',
        8: 'Referencias oficiales y académicas citadas bajo formato APA 7.ª edición.',
        9: 'Redacción clara, técnica y ortografía cuidada en las 51 respuestas.',
        10: 'Evidencia ajustes concretos tras retroalimentación docente y de IA.',
      },
      finalComment:
        'La propuesta obtiene 40/40 puntos (100% — Nivel Sobresaliente). Demuestra una integración ejemplar entre la pasión emprendedora, los 10 principios de filosofía empresarial, el análisis del entorno, la comparativa de cuatro entidades bancarias en Costa Rica y una arquitectura de Sistema de Información Gerencial realista, colaborativa y respaldada por especialistas.',
      evaluatedByAI: true,
    },
  };
}
